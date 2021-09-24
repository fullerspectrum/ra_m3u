const path = require("path");
const fs = require("fs");
let dir = process.argv[2];

if (dir.charAt(dir.length - 1) === '"') {
    dir = dir.substr(0, dir.length - 1);
}

fs.readdir(dir, (err, files) => {
    if (err) return console.error(err);
    let filteredFiles = [];
    let tempFile = "";
    let tempTitle = "";
    files.forEach((file) => {
        if (file.match(/\(Disc \d\).+cue/g)) {
            filteredFiles.push(file);
        }
    });
    filteredFiles.forEach((file) => {
        let title = file.replace(/\(Disc \d\).+cue/g, "").trim();
        if (title !== tempTitle && tempTitle) {
            fs.writeFile(`${dir}\\${tempTitle}.m3u`, tempFile, (err) => {
                if (err) return console.error(err);
            });
            tempFile = `${file}\n`;
        } else {
            tempFile = tempFile.concat(`${file}\n`);
        }
        tempTitle = file.replace(/\(Disc \d\).+cue/g, "").trim();
    });
});
