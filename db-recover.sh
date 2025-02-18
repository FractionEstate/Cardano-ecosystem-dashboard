# Usage: ./db-recover.sh <backup_file>

if [ $# -eq 0 ]; then
    echo "Please provide the backup file name"
    exit 1
fi

BACKUP_FILE=$1

docker-compose -f docker-compose.prod.yml exec -T db psql -U ${DB_USER} -d ${DB_NAME} < ./backups/${BACKUP_FILE}

echo "Database recovered from ${BACKUP_FILE}"

