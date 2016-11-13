if [ -z $NO_SYNC_AIRTABLE ]; then
    node make.js
    rm tongyi/content/* -rf
    cp tongyi_content/* tongyi/content/ -r  
fi
cd tongyi
../hugo -t $THEME_NAME
node ../server.js
