node make.js
cp tongyi_content/* $THEME_NAME/ -r
cd $THEME_NAME
jekyll build
jekyll serve --host $IP --port $PORT --baseurl ''