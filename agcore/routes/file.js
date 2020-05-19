const express = require('express');
const router = express.Router();
const url = require('url');

const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const uuidv4 = require('uuid/v4');

const FolderPath = __dirname + '/../../uploads/files/';
const ReportPath = __dirname + '/../../uploads/report/';
const UploadPath = __dirname + '/../../uploads/';

router.post('/upload', (req, res) => {
    console.log('Upload start');
    var form = new formidable.IncomingForm();
    let newname;
    let folder;
    form.parse(req)
        .on('fileBegin', (name, file) => {
            // console.log('Uploaded fileBegin', name, file);
            let parts = file.name.split('.');
            newname =
                parts.length !== 1 ? `${parts[0]}_${uuidv4()}.${parts[parts.length - 1]}` : `${file.name}_${uuidv4()}`;
            file.path = !folder ? FolderPath + newname : UploadPath + folder + '/' + newname;
        })
        .on('field', (fieldName, fieldValue) => {
            if (fieldName === "folder") folder = fieldValue;
        })
        .on('file', (name, file) => {
            // console.log('Uploaded file', name, file);
        })
        .on('aborted', () => {
            // console.error('Request aborted by the user');
            //todo check for end
        })
        .on('error', (err) => {
            console.error('Error', err);
            throw err;
        })
        .on('end', () => {
            res.send({ pathname: newname });
        });

    // , (err, fields, files) => {
    //     if (err) {
    //         console.error('Error', err)
    //         throw err
    //     }
    //     console.log('Fields', fields)
    //     console.log('Files', files)
    //     files.map(file => {
    //         console.log(file)
    //     })
    // });
});

router.get('/get', (req, res) => {
    let url_parts = url.parse(req.url, true);
    let query = url_parts.query;
    let _path = FolderPath + query.id;
    fs.stat(_path, function (err, stat) {
        if (err == null) {
            res.sendFile(path.resolve(_path));
        } else {
            // console.error('file not found: ' + _path);
            res.send(404, { error: 'file not found' });
        }
    });
});

module.exports = router;