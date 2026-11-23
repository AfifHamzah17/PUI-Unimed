#!/usr/bin/env bash
# Memperbaiki unggah foto/PDF yang gagal dengan galat:
#   Permission 'iam.serviceAccounts.signBlob' denied
#
# Penyebab: service account yang dipakai Cloud Run belum boleh menandatangani URL unggahan (signed URL) untuk dirinya
# sendiri. Skrip ini mencari service account itu dari layanan yang sedang berjalan, lalu memberinya izin yang
# dibutuhkan. Aman dijalankan berulang kali. BELUM diuji pada proyek GCP sungguhan; baca dulu sebelum menjalankan.
#
# Pakai (Cloud Shell atau gcloud yang sudah login):
#   PROJECT_ID=pui-unimed SERVICE=pui-backend REGION=asia-southeast2 \
#   ORIGINS="https://www.celae-pui-unimed.com" ./fix-upload-permission.sh
# BUCKET diambil otomatis dari env GCS_BUCKET layanan; isi manual bila gagal: BUCKET=nama-bucket
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?isi PROJECT_ID}"
SERVICE="${SERVICE:?isi SERVICE (nama layanan Cloud Run)}"
REGION="${REGION:-asia-southeast2}"
ORIGINS="${ORIGINS:?isi ORIGINS: alamat frontend, pisahkan dengan spasi, tanpa garis miring di akhir}"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "== 1. Aktifkan IAM Credentials API (dipakai untuk signBlob)"
gcloud services enable iamcredentials.googleapis.com

echo "== 2. Cari service account yang dipakai layanan"
SA="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(spec.template.spec.serviceAccountName)')"
if [ -z "$SA" ]; then
  NUM="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
  SA="${NUM}-compute@developer.gserviceaccount.com"   # bawaan Cloud Run bila tidak ditentukan
fi
echo "   service account: $SA"

echo "== 3. Izinkan service account menandatangani untuk dirinya sendiri"
gcloud iam service-accounts add-iam-policy-binding "$SA" \
  --member="serviceAccount:${SA}" --role="roles/iam.serviceAccountTokenCreator" >/dev/null

echo "== 4. Cari bucket dari env GCS_BUCKET layanan"
if [ -z "${BUCKET:-}" ]; then
  BUCKET="$(gcloud run services describe "$SERVICE" --region "$REGION" --format=json \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); e=d["spec"]["template"]["spec"]["containers"][0].get("env",[]); print(next((x.get("value","") for x in e if x["name"]=="GCS_BUCKET"),""))')"
fi
[ -n "$BUCKET" ] || { echo "GCS_BUCKET tidak ditemukan di layanan. Jalankan ulang dengan BUCKET=nama-bucket"; exit 1; }
echo "   bucket: $BUCKET"

echo "== 5. Izin menulis ke bucket"
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${SA}" --role="roles/storage.objectAdmin" >/dev/null

echo "== 6. CORS bucket (peramban mengunggah langsung ke bucket dengan PUT)"
python3 - "$ORIGINS" > /tmp/pui-cors.json <<'PY'
import json, sys
origins = [o.rstrip('/') for o in sys.argv[1].split()]
print(json.dumps([{"origin": origins, "method": ["PUT", "GET", "HEAD"],
                   "responseHeader": ["Content-Type", "x-goog-content-length-range"], "maxAgeSeconds": 3600}]))
PY
gcloud storage buckets update "gs://${BUCKET}" --cors-file=/tmp/pui-cors.json

echo
echo "Selesai. Izin IAM butuh sekitar 1 sampai 2 menit untuk berlaku. Setelah itu coba unggah lagi."
echo "Tidak perlu deploy ulang. Bila masih gagal, lihat Logs Explorer: pesan 'gagal membuat signed URL unggahan' memuat petunjuknya."
