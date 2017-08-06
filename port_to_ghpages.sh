if [ -z $NO_SYNC_AIRTABLE ]; then
    node make.js
    cp tongyi_content/* tongyi/content/ -rf
fi
cd tongyi
../hugo -t $THEME_NAME
cd public
git add .
git commit -m "Update by auto_port bash."
git push
