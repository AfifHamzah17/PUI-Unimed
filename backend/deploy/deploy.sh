#!/usr/bin/env bash
# Penyiapan dan deploy backend PUI ke Google Cloud.
#
# BELUM DIJALANKAN di lingkungan pengembangan (tidak ada akses ke GCP). Baca dulu setiap langkah, jalankan
# bertahap, dan sesuaikan variabel di bawah. Perintah di sini memakai gcloud CLI versi terbaru.
#
# Prasyarat: gcloud terpasang dan `gcloud auth login`, proyek GCP dengan billing aktif.
set -euo pipefail

# ----- ISI INI -----
PROJECT_ID="isi-project-id"
REGION="asia-southeast2"                       # Jakarta
BUCKET="${PROJECT_ID}-pui-files"
FRONTEND_ORIGIN="https://domain-vercel-anda.vercel.app"   # tanpa garis miring di akhir
ADMIN_EMAIL="ketua@unimed.ac.id"            # admin pertama; kata sandi sementara dibuat otomatis di langkah 5
# -------------------

SERVICE="pui-api"
SA_NAME="pui-api-runtime"
SA="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
cd "$(dirname "$0")/.."   # folder backend/

gcloud config set project "$PROJECT_ID"

echo "== 1. Aktifkan API"
gcloud services enable run.googleapis.com firestore.googleapis.com storage.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com iamcredentials.googleapis.com secretmanager.googleapis.com

echo "== 2. Firestore (Native mode)"
gcloud firestore databases create --location="$REGION" --type=firestore-native || echo "(database sudah ada, lanjut)"

echo "== 3. Service account runtime dengan hak minimum"
gcloud iam service-accounts create "$SA_NAME" --display-name="PUI API runtime" || echo "(sudah ada, lanjut)"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${SA}" --role="roles/datastore.user"
# Diperlukan agar @google-cloud/storage bisa membuat signed URL tanpa kunci pribadi (memakai IAM signBlob).
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --member="serviceAccount:${SA}" --role="roles/iam.serviceAccountTokenCreator"

echo "== 4. Bucket Cloud Storage"
gcloud storage buckets create "gs://${BUCKET}" --location="$REGION" --uniform-bucket-level-access || echo "(bucket sudah ada, lanjut)"
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" --member="serviceAccount:${SA}" --role="roles/storage.objectAdmin"
# Dokumen jurnal bersifat publik. Jika kebijakan organisasi melarang allUsers, lihat README (opsi CDN atau proxy).
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" --member="allUsers" --role="roles/storage.objectViewer"
sed "s#__FRONTEND_ORIGIN__#${FRONTEND_ORIGIN}#" deploy/bucket-cors.json > /tmp/pui-cors.json
gcloud storage buckets update "gs://${BUCKET}" --cors-file=/tmp/pui-cors.json

echo "== 5. Rahasia (Secret Manager): kunci sesi dan kata sandi sementara admin pertama"
# Kata sandi sementara hanya dicetak SEKALI di akhir skrip. Catat, lalu ganti saat login pertama.
BOOT_PW="$(openssl rand -base64 18 | tr -dc 'A-Za-z0-9' | head -c 14)A9"
printf '%s' "$(openssl rand -base64 48)" | gcloud secrets create pui-session-secret --data-file=- 2>/dev/null \
  || printf '%s' "$(openssl rand -base64 48)" | gcloud secrets versions add pui-session-secret --data-file=-
printf '%s' "$BOOT_PW" | gcloud secrets create pui-bootstrap-password --data-file=- 2>/dev/null \
  || printf '%s' "$BOOT_PW" | gcloud secrets versions add pui-bootstrap-password --data-file=-
for S in pui-session-secret pui-bootstrap-password; do
  gcloud secrets add-iam-policy-binding "$S" --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"
done

echo "== 6. Deploy Cloud Run (build dari source)"
gcloud run deploy "$SERVICE" --source . --region "$REGION" \
  --service-account "$SA" \
  --allow-unauthenticated \
  --min-instances 0 --max-instances 3 \
  --memory 256Mi --cpu 1 --concurrency 80 --timeout 30 \
  --set-secrets "SESSION_SECRET=pui-session-secret:latest,BOOTSTRAP_ADMIN_PASSWORD=pui-bootstrap-password:latest" \
  --set-env-vars "NODE_ENV=production,STORE=firestore,ALLOWED_ORIGINS=${FRONTEND_ORIGIN},GCS_BUCKET=${BUCKET},BOOTSTRAP_ADMIN_EMAIL=${ADMIN_EMAIL}"

URL="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')"
echo
echo "Selesai. URL API: ${URL}"
echo "Admin pertama:  ${ADMIN_EMAIL}   kata sandi sementara: ${BOOT_PW}   (wajib diganti saat login pertama)"
echo "1) Isi di Vercel: VITE_API_URL=${URL}  lalu redeploy."
echo "2) Isi data awal (sekali):  cd backend && FIRESTORE_DATABASE_ID='(default)' npm run seed   (butuh: gcloud auth application-default login)"
echo "3) Setelah login pertama dan ganti sandi, hapus bootstrap dari Cloud Run:"
echo "   gcloud run services update ${SERVICE} --region ${REGION} --remove-env-vars BOOTSTRAP_ADMIN_EMAIL --remove-secrets BOOTSTRAP_ADMIN_PASSWORD"
