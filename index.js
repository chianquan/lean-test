/**
 * Created by bhb on 17/7/27.
 */
'use strict';

const AV = require('leanengine');
const express = require('express');
const app = express();
const uuid = require('node-uuid');
const bodyParser = require("body-parser");


const APP_ID = process.env.LC_APP_ID || process.env.LEANCLOUD_APP_ID;
const APP_KEY = process.env.LC_APP_KEY || process.env.LEANCLOUD_APP_KEY;
const MASTER_KEY = process.env.LC_APP_MASTER_KEY || process.env.LEANCLOUD_APP_MASTER_KEY;


AV.serverURL = process.env.LC_SERVER_URL || 'http://api.leancloud.cn';
console.log(`AV.serverURL = ${AV.serverURL};`);

AV.initialize(APP_ID, APP_KEY, MASTER_KEY);
var cloud = AV.Cloud;

cloud.useMasterKey();


app.use(cloud);
app.use(AV.Cloud.CookieSession({
    secret: 'test_test',
    maxAge: 3600000,
    fetchUser: false
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.post('/user/register', function(req, res, next) {
    const mobilePhoneNumber = req.body.mobilePhoneNumber;
    const password = req.body.password;
    if (!mobilePhoneNumber || !password) {
        return next(new Error('手机号码和密码不能为空'));
    }
    var user = new AV.User();
    user.set("username", mobilePhoneNumber + '-' + uuid.v4());
    user.set("mobilePhoneNumber", mobilePhoneNumber);
    user.set("password", password);

    // 1. 注册用户
    return user.signUp()
        .then(function() {
            return res.status(201);
        })
        .catch(next);

});
app.post('/user/login', function(req, res, next) {

    const mobilePhoneNumber = req.body.mobilePhoneNumber;
    const password = req.body.password;
    if (!mobilePhoneNumber || !password) {
        return next(new Error('手机号码和密码不能为空'));
    }
    AV.User.logInWithMobilePhone(mobilePhoneNumber, password)
        .then(function(userInfo) {
            return res.json({sessionToken: userInfo._sessionToken});
        });
});
app.use(function(req, res, next) {
    if (!req.headers.token) {
        return res.status(403).end();
    }
    return AV.User.become(req.headers.token)
        .then(function() {
            next();
        })
        .catch(next);

});
app.get('/user/current', function(req, res, next) {
    const user = AV.User.current();
    return res.json({userInfo: user});
});

const PORT = parseInt(process.env.LC_APP_PORT || process.env.LEANCLOUD_APP_PORT || process.env.PORT || 5000);

app.use(function(err, req, res, next) {
    console.error(err, err & err.stack);
    res.status(500);
    res.json({
        message: err.message,
    });
});

app.listen(PORT, function() {
    console.log('监听成功,端口:' + PORT);
});