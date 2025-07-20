const fs = require('fs');

class WebpackUtils {
    static replaceFileContent(src, search, replace) {
        if (!fs.existsSync(src)) {
            throw src + " File not found";
        }
        let file_content = fs.readFileSync(src, 'utf8');
        const final_content = file_content.replace(search, replace);
        return fs.writeFile(src, final_content, (err) => {
            if (err) throw err;
        });
    }
}

module.exports = WebpackUtils