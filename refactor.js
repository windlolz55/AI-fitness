var fso = new ActiveXObject("Scripting.FileSystemObject");
var ForReading = 1, ForWriting = 2;

function readAll(path) {
    var f = fso.OpenTextFile(path, ForReading, false, -1); // -1 = TristateTrue for Unicode/UTF-16? Wait, Windows JS uses TristateFalse for ASCII/ANSI.
    var text = f.ReadAll();
    f.Close();
    return text;
}

function writeAll(path, text) {
    var f = fso.OpenTextFile(path, ForWriting, true, -1);
    f.Write(text);
    f.Close();
}

try {
    // Note: cscript might struggle with UTF-8. 
} catch(e) {
}
