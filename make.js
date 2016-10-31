var Airtable = require('airtable');
var base = new Airtable({ apiKey: process.env.API_KEY }).base(process.env.BASE_KEY);
var fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;
var sys = require('sys')
var exec = require('child_process').exec;


var contents = {};
var list_all_contents = [];
var list_all_source = [];
var menu = '';
var menu_file = `${process.env.THEME_NAME}/_data/menu.yaml`
// var arr_name = [];

var is_created_finished = false;

base('新聞').select({
    // Selecting the first 3 records in Main View:
    // maxRecords: 3,
    view: "網路新聞、討論"
}).eachPage(function page(records, fetchNextPage) {
    records.forEach(function(record) {
        var obj = {};
        obj.title = record.get('標題');
        obj.url = record.get('連結');
        obj.tags = record.get('tags');
        obj.date = record.get('日期');
        obj.from = record.get('來源');
        obj.date_code = (new Date(obj.date)).getTime();
        
        list_all_source.push(obj);
    });
    
    fetchNextPage();
}, function(error) {
    if (error) {
        console.log(error);
    }
    load_pages();
});


function load_pages(){
    base('網站內容').select({
        // Selecting the first 3 records in Main View:
        // maxRecords: 3,
        view: "Main View"
    }).eachPage(function page(records, fetchNextPage) {
    
        // This function (`page`) will get called for each page of records.
    
        records.forEach(function(record) {
            if( record.get('發佈')){
                var obj = {};
                obj.name = record.get('Name');
                obj.body = record.get('內文');
                obj.parentObj = record.get('上層內容');
                obj.path = record.get('路徑');
                obj.tags = record.get('tags');
                obj.order = record.get('順序');
                obj.is_index = record.get('打勾是目錄，不勾是頁面');
                obj.children = [];
                obj.id = record.id;
                
                // arr_name.push(obj.name);
                contents[obj.id] = obj;
                list_all_contents.push(obj);
            }
            
        });
    
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    
    }, function(error) {
        if (error) {
            console.log(error);
        }
        start_process();
    });

}

function start_process() {
    // console.log(arr_name);
    // console.log(arr_content);
    
    // console.log(arr_content);
    list_all_contents.sort(function(a,b){
        var a_order = (a.order == undefined)?0:a.order;
        var b_order = (b.order == undefined)?0:b.order;
        return a_order - b_order;
    })
    list_all_contents.forEach(function(obj){
        obj.is_created_finished = false;
        if(obj.parentObj !== undefined){
            contents[obj.parentObj[0]].children.push(obj);
        }
    });
    list_all_contents.forEach(function(obj){
        if(obj.parentObj !== undefined){
            delete contents[obj.id];
        }
    });
    // console.log(contents);
    
    list_all_contents.forEach(function(obj){
        if(obj.parentObj == undefined){
            // delete contents[obj.id];
            create_page(obj, '');
            menu += create_menu(obj, '');
        }
    });
    
    setTimeout(after,2000);
    
    
}

function create_page(obj,folder_name) {
    var folder = (folder_name == '')?'/':(folder_name+'/');
    var path = (obj.path == undefined)?'index':obj.path;
    var filename = 'tongyi_content' + folder + path + '.md';
    
    
    fs.stat(filename, function(err, stat) {
        if(err == null) {
            console.log(filename + 'File exists');
            fs.unlink(filename);
        } else if(err.code == 'ENOENT') {
            // file does not exist
            // fs.writeFile('log.txt', 'Some log\n');
        } else {
            console.log('Some other error: ', err.code);
        }
    });
    
    
    mkdirp(getDirName(filename), function (err) {
        if (err) return err;
        
        // var true_path = 'tongyi_content' + folder + path;
    
        var data = '';
        data += '---\n';
        data += `title: "${obj.name}"\n`;
        data += `layout: default\n`;
        data += '---\n';
         
         
        data += (obj.body == undefined)?'':obj.body;
        data += '\n';
        // console.log(obj.name);
        // console.log('tongyi_content' + folder + path + '.md');
        
        // 產生相關新聞
        
        // if(obj.tags !== undefined && obj.name == '反空汙自救會'){
        if(obj.tags !== undefined){
            data += '\n';
            data += '# 相關新聞連結\n';
            
            var this_sources = [];
            obj.tags.forEach(function(tag){
                // console.log(`obj.tag = ${tag}`);
                list_all_source.forEach(function(source){
                    // console.log(source.tags);
                    if (source.tags !== undefined && 
                        source.tags.indexOf(tag) >= 0 && 
                        this_sources.indexOf(source) == -1){
                        // console.log(`UN, Joined !! ${source.title}`);
                        this_sources.push(source);
                    }
                });
            });
            // console.log(this_sources);
            this_sources.sort(function(a,b){
                return a.date_code - b.date_code;
            })
            this_sources.forEach(function(source){
                data+=`- [${source.title} - ${source.from}](${source.url})\n  *${source.date}*\n`;
            })
        }
        
        // 產生子頁面
        if( obj.children !== undefined && obj.is_index !== undefined){
            // Has children page
            obj.children.forEach(function( child){
                // console.log(folder_name+'/'+path);
                create_page(child,folder+path);
            });
        }else if(obj.children.length > 0 ){
            // Has children section.
            obj.children.forEach(function( child){
                // console.log(folder_name+'/'+path);
                data += '\n';
                data += `# ${child.name}\n\n`;
                data += `${child.body}\n`;
                child.is_created_finished = true;
            });
            
        }
        fs.writeFile(filename, data);
        
        
        obj.is_created_finished = true;
    });
}

function create_menu(obj,folder_name) {
    var folder = (folder_name == '')?'/':(folder_name+'/');
    var path = (obj.path == undefined)?'index':obj.path;
    var filename = 'tongyi_content' + folder + path + '.md';
    
    var level = folder.match(/\//g).length;
    var indent = '';
    var return_menu = '';
    for (var i = 0; i < level-1; i++) {
        // console.log(i);
        indent += "    ";
    }
    return_menu += (indent + `- title: "${obj.name}"\n`);
    var path_html = folder + path+'.html';
    return_menu += (indent + `  url: "${path_html}"\n`);
    
    if(obj.is_index && obj.children.length > 0){
        return_menu += indent + `  children:\n`;
    }
    
    return_menu += '\n';
    
    if( obj.children !== undefined && obj.is_index !== undefined){
        // Has children page
        obj.children.forEach(function( child){
            // console.log(folder_name+'/'+path);
            return_menu += create_menu(child,folder+path);
        });
    }
    return return_menu;
}


function after(){
    
    // console.log(menu);
    
    fs.stat(menu_file, function(err, stat) {
        if(err == null) {
            console.log(menu_file + 'File exists');
            fs.unlink(menu_file);
        } else if(err.code == 'ENOENT') {
            // file does not exist
            // fs.writeFile('log.txt', 'Some log\n');
        } else {
            console.log('Some other error: ', err.code);
        }
        
        mkdirp(getDirName(menu_file), function (err) {
            if(err)return err;
            fs.writeFile(menu_file, menu);
        });
        
    });
    
}
