backcolor = "#171717";
backcolor2 = "#282828";
textcolor = "#FFFFFF";

let defaultPath = app.RealPath("/sdcard/DroidScript/");
let sharedPath = app.RealPath("/storage/emulated/0/DCIM/DroidScript/");

let selectedProject = "";
let projectData = {}; // {name:{count,time}}

function OnStart() {
    app.GetPermission("Storage", OnPermission);

    lay = app.CreateLayout("Linear", "FillXY,Vertical");
    app.SetBackColor(backcolor);

    list = app.CreateList("", 0.9, 0.8, "TwoLine");
    list.SetTextColor(textcolor);
    list.SetBackColor(backcolor2);
    list.SetOnTouch(OnProjectSelect);
    lay.AddChild(list);

    // Spacer
    lay.AddChild(app.CreateLayout("Linear", "", 1, 0.05));

    // Button
    copyBtn = app.CreateButton("Copy → Shared", 0.9, 0.1);
    copyBtn.SetBackColor(backcolor2);
    copyBtn.SetTextColor(textcolor);
    copyBtn.SetOnTouch(OnCopyClick);
    lay.AddChild(copyBtn);

    app.AddLayout(lay);

    LoadProjects();
    // app.ShowPopup( FormatTime(1773837078473) )
    function OnPermission() {}
}

// =============================
// 🔹 Project load + SORT
function LoadProjects() {
    var all = app.ListFolder(defaultPath);
    var arr = [];

    all.forEach(function(p) {
        var imgFolder = defaultPath + p + "/img/";
        if (!app.FolderExists(imgFolder)) return;

        var icon = imgFolder + p + ".png";
        var versionFile = defaultPath + p + "/GitVersion.txt";
        var timeFile = defaultPath + p + "/GitTime.txt";

        var count = 0;
        var time = 0;

        if (app.FileExists(versionFile)) {
            count = parseInt(app.ReadFile(versionFile)) || 0;
        }

        if (app.FileExists(timeFile)) {
            time = parseInt(app.ReadFile(timeFile)) || 0;
        }

        projectData[p] = {count: count, time: time};

        arr.push({
            name: p,
            count: count,
            time: time,
            icon: app.FileExists(icon) ? icon : null
        });
    });

    // 🔥 SORT (latest first)
    arr.sort((a,b)=> b.time - a.time);

    // 🔹 List format
    var listData = [];

    arr.forEach(function(o) {
        var dateStr = o.time ? FormatTime(o.time) : "Never";

        var title = o.name;
        var sub = "Last: " + dateStr;
        
        // 🔥 RIGHT SIDE COUNT
        var item = title + "~~" + sub + "~~" + o.count;
        
        if (o.icon) item += ":" + o.icon;

        listData.push(item);
    });

    list.SetList(listData);
}

// =============================
function FormatTime(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" +
        (d.getMonth()+1).toString().padStart(2,'0') + "-" +
        d.getDate().toString().padStart(2,'0') + " " +
        d.getHours().toString().padStart(2,'0') + ":" +
        d.getMinutes().toString().padStart(2,'0');
}

// =============================
function OnProjectSelect(title) {
    selectedProject = title.split("~~")[0];
    app.ShowPopup(selectedProject);
}

// =============================
function OnCopyClick() {
    if (!selectedProject) {
        app.ShowPopup("Select project!");
        return;
    }

    var data = projectData[selectedProject] || {count:0,time:0};

    // 🔹 update count + time
    data.count++;
    data.time = Date.now();

    var base = defaultPath + selectedProject + "/";
    app.WriteFile(base + "GitVersion.txt", data.count.toString());
    app.WriteFile(base + "GitTime.txt", data.time.toString());

    projectData[selectedProject] = data;

    // 🔹 UI update
    LoadProjects();

    // 🔹 COPY
    CopyToShared();

    app.ShowPopup(selectedProject + " ✔ (" + data.count + ")");
}

// =============================
function CopyToShared() {
    var src = defaultPath + selectedProject + "/";
    var dst = sharedPath + selectedProject + "/";

    // 🔴 1. Agar mavjud bo‘lsa → o‘chiramiz
    if (app.FolderExists(dst)) {
        DeleteFolder(dst);
    }

    // 🟢 2. Keyin qayta copy
    CopyFolder(src, dst);
}

// =============================
function CopyFolder(src, dst) {
    if (!app.FolderExists(dst)) app.MakeFolder(dst);

    var files = app.ListFolder(src);
    files.forEach(function(f) {
        var fSrc = src + f;
        var fDst = dst + f;

        if (app.IsFolder(fSrc)) {
            CopyFolder(fSrc + "/", fDst + "/");
        } else {
            app.CopyFile(fSrc, fDst);
        }
    });
}

function DeleteFolder(path) {
    if (!app.FolderExists(path)) return;

    var files = app.ListFolder(path);

    files.forEach(function(f) {
        var full = path + f;

        if (app.IsFolder(full)) {
            DeleteFolder(full + "/");
        } else {
            app.DeleteFile(full);
        }
    });

    app.DeleteFolder(path);
}