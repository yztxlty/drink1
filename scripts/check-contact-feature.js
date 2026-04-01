#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const componentDir = path.join(root, 'components/contact-dialog');
const jsPath = path.join(componentDir, 'contact-dialog.js');
const wxmlPath = path.join(componentDir, 'contact-dialog.wxml');
const wxssPath = path.join(componentDir, 'contact-dialog.wxss');
const jsonPath = path.join(componentDir, 'contact-dialog.json');
const profileWxml = path.join(root, 'pages/profile/profile.wxml');
const profileJs = path.join(root, 'pages/profile/profile.js');
const profileJson = path.join(root, 'pages/profile/profile.json');
const qrAsset = path.join(root, 'assets/medals/kefu.png');

assert.ok(fs.existsSync(jsPath), 'Expected contact-dialog.js to exist');
assert.ok(fs.existsSync(wxmlPath), 'Expected contact-dialog.wxml to exist');
assert.ok(fs.existsSync(wxssPath), 'Expected contact-dialog.wxss to exist');
assert.ok(fs.existsSync(jsonPath), 'Expected contact-dialog.json to exist');
assert.ok(fs.existsSync(qrAsset), 'Expected contact QR asset to exist at assets/medals/kefu.png');

const js = fs.readFileSync(jsPath, 'utf8');
const wxml = fs.readFileSync(wxmlPath, 'utf8');
const wxss = fs.readFileSync(wxssPath, 'utf8');
const profileWxmlContent = fs.readFileSync(profileWxml, 'utf8');
const profileJsContent = fs.readFileSync(profileJs, 'utf8');
const profileJsonContent = fs.readFileSync(profileJson, 'utf8');

assert.ok(
  js.includes('wx.saveImageToPhotosAlbum'),
  'contact-dialog.js should call wx.saveImageToPhotosAlbum'
);
assert.ok(
  js.includes('wx.authorize'),
  'contact-dialog.js should request album permission before saving'
);
assert.ok(
  js.includes('wx.openSetting'),
  'contact-dialog.js should guide users to open settings when photo permission is denied'
);
assert.ok(
  wxss.includes('backdrop-filter: blur(20px)'),
  'contact-dialog.wxss should use backdrop-filter: blur(20px)'
);
assert.ok(
  wxml.includes('{{title}}') && wxml.includes('saveButtonText'),
  'contact-dialog.wxml should render the title and save button via bindings'
);
assert.ok(
  wxml.includes('show-menu-by-longpress="{{true}}"'),
  'contact-dialog.wxml should allow native long-press QR recognition'
);
assert.ok(
  js.includes("value: '联系作者/加入社群'") &&
    js.includes("value: '保存图片到相册'"),
  'contact-dialog.js should define the default contact title and button text'
);
assert.ok(
  wxss.includes('.contact-dialog-save-btn {') &&
    wxss.includes('display: flex;') &&
    wxss.includes('justify-content: center;') &&
    wxss.includes('align-items: center;') &&
    wxss.includes('text-align: center;'),
  'contact-dialog.wxss should center the save button label'
);
assert.ok(
  profileWxmlContent.includes('contact-dialog'),
  'profile.wxml should include the contact-dialog component'
);
assert.ok(
  profileWxmlContent.includes('qr-src="/assets/medals/kefu.png"'),
  'profile.wxml should pass the QR asset into the contact dialog'
);
assert.ok(
  profileJsContent.includes('contactDialogVisible'),
  'profile.js should track the contact dialog visibility'
);
assert.ok(
  profileJsonContent.includes('/components/contact-dialog/contact-dialog'),
  'profile.json should register the contact-dialog component'
);

console.log('Contact dialog feature check passed.');
