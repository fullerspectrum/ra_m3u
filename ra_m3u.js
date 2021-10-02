const path = require("path");
const fs = require("fs");
const fileTypes = [".cue", ".iso", ".chd", ".cdi", ".rvz", ".gdi"];
// let dir = process.argv[2];
let dir = "";

if (process.argv[2] && dir.charAt(dir.length - 1) === '"') {
    dir = dir.substr(0, dir.length - 1);
}

function createFolder(dir) {
    if (!fs.existsSync(`${dir}/__m3u`)) {
        fs.mkdirSync(path.join(dir, "__m3u"));
    }
}

if (!process.argv[2] || !fs.statSync(process.argv[2]).isDirectory()) {
    let psScript = `
    Function Select-FolderDialog
    {
        param([string]$Description="Select Folder",[string]$RootFolder="Desktop")
    
     [System.Reflection.Assembly]::LoadWithPartialName("System.windows.forms") |
         Out-Null     
    
       $objForm = New-Object System.Windows.Forms.FolderBrowserDialog
            $objForm.Rootfolder = $RootFolder
            $objForm.Description = $Description
            $Show = $objForm.ShowDialog()
            If ($Show -eq "OK")
            {
                Return $objForm.SelectedPath
            }
            Else
            {
                Write-Error "Operation cancelled by user."
            }
        }
    
    $folder = Select-FolderDialog # the variable contains user folder selection
    write-host $folder
    `;
    var spawn = require("child_process").spawn,
        child;
    child = spawn("powershell.exe", [psScript]);
    child.stdout.on("data", function (data) {
        if (data.toString().charAt(1) === ":") {
            main(data.toString());
        }
    });
    child.stdin.end(); //end input
} else main(process.argv[2]);

function main(dir) {
    fs.readdir(dir, (err, files) => {
        if (err) return console.error(err);
        let multiPartFiles = [];
        let singlePartFiles = [];
        let filesInFolders = [];
        let multiPartFolders = [];
        let tempFile = "";
        let tempTitle = "";
        files.forEach((file) => {
            let isDir = fs.lstatSync(path.join(dir, file)).isDirectory();
            let isMultiDisc = /\(Disc \d.+/g.test(file);
            if (isDir && isMultiDisc) {
                multiPartFolders.push(file);
            } else if (isDir) {
                filesInFolders.push(file);
            } else if (isMultiDisc) {
                multiPartFiles.push(file);
            } else if (fileTypes.some((term) => file.endsWith(term))) {
                singlePartFiles.push(file);
            }
        });
        multiPartFiles.forEach((file, i) => {
            let title = file.replace(/\(Disc \d\)/g, "").trim();
            title = title.substring(0, title.length - 4).trim();
            createFolder(dir);
            let linePath = path.join(dir, file);
            if (
                (title !== tempTitle || i === multiPartFiles.length - 1) &&
                tempTitle
            ) {
                if (i === multiPartFiles.length - 1) {
                    tempFile = tempFile.concat(`${linePath}\n`);
                }
                fs.writeFileSync(
                    path.join(dir, "__m3u", `${tempTitle}.m3u`),
                    tempFile
                );
                tempFile = `${linePath}\n`;
            } else {
                tempFile = tempFile.concat(`${linePath}\n`);
            }
            tempTitle = title.trim();
        });
        tempTitle = "";
        tempFile = "";
        multiPartFolders.forEach((folder, i) => {
            let title = folder.replace(/\(Disc \d of \d\)/g, "").trim();
            title = title.replace(/\(Disc \d\)/g, "").trim();
            createFolder(dir);
            if (
                (title !== tempTitle || i === multiPartFolders.length - 1) &&
                tempTitle
            ) {
                if (i === multiPartFolders.length - 1) {
                    let gameFiles = fs.readdirSync(path.join(dir, folder));
                    gameFiles.forEach((file) => {
                        if (fileTypes.some((term) => file.includes(term))) {
                            let linePath = path.join(dir, folder, file);
                            tempFile = tempFile.concat(
                                `${linePath.toString()}\n`
                            );
                        }
                    });
                }
                fs.writeFile(
                    path.join(dir, "__m3u", `${tempTitle}.m3u`),
                    tempFile,
                    (err) => {
                        if (err) return console.error(err);
                        if (i !== multiPartFolders.length - 1) {
                            let gameFiles = fs.readdirSync(
                                path.join(dir, folder)
                            );
                            gameFiles.forEach((file) => {
                                if (
                                    fileTypes.some((term) =>
                                        file.includes(term)
                                    )
                                ) {
                                    let linePath = path.join(dir, folder, file);
                                    tempFile = `${linePath.toString()}\n`;
                                }
                            });
                        }
                    }
                );
            } else {
                let gameFiles = fs.readdirSync(path.join(dir, folder));
                gameFiles.forEach((file) => {
                    if (fileTypes.some((term) => file.includes(term))) {
                        let linePath = path.join(dir, folder, file);
                        tempFile = tempFile.concat(`${linePath.toString()}\n`);
                    }
                });
            }
            tempTitle = title;
        });
        singlePartFiles.forEach((file) => {
            let title = file
                .replace(/\.cue|\.chd|\.cdi|\.rvz|\.iso/, "")
                .trim();
            if (fileTypes.some((term) => file.includes(term))) {
                createFolder(dir);
                fs.writeFile(
                    path.join(dir, "__m3u", `${title}.m3u`),
                    path.join(dir, file),
                    (err) => {
                        if (err) return console.error(err);
                    }
                );
            }
        });
        filesInFolders.forEach((folder) => {
            let title = folder;
            fs.readdir(path.join(dir, folder), (err, gameFiles) => {
                if (err) console.error(err);
                gameFiles.forEach((file) => {
                    if (fileTypes.some((term) => file.includes(term))) {
                        createFolder(dir);
                        fs.writeFile(
                            path.join(dir, "__m3u", `${title}.m3u`),
                            path.join(dir, folder, file),
                            (err) => {
                                if (err) return console.error(err);
                            }
                        );
                    }
                });
            });
        });
    });
}
