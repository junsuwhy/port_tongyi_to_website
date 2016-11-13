if [ -z $NO_SYNC_AIRTABLE ]; then
    node make.js
    cp tongyi_content/* tongyi/content/ -rf
fi
cd tongyi
../hugo -t $THEME_NAME
node ../server.js
