/*
 *    ____  |
 *         /     Author  : Alexander A. Magtipon
 *       /       Created : 2010-10-07
 *     /         Updated : 2010-10-07
 *  _______|     Remarks : zander - zand3rs@gmail.com
 *
 *
 * Filename    : server.js
 * Description : Chat Roulette Server
 *
 * Copyright   : (c)
 *
 *
 * $Id$
 */

/******************************************************************************/


//==============================================================================
// globals...

var g_session_map = new Array();
var g_session_table = new Array();

//==============================================================================
// local functions

function pushEvent(session_key, qitem)
{
    var session = g_session_table[session_key];
    if (! session) {
        return;
    }

    session.event_queue.push(qitem);
}

//-----------------------------------------------------------------------------

function popEvent(session_key)
{
    var session = g_session_table[session_key];
    if (! session) {
        return null;
    }

    return session.event_queue.shift();
}

//-----------------------------------------------------------------------------

function doMatchup(session_key)
{
    var mysession = g_session_table[session_key];
    if (! mysession) {
        return;
    }

    for (var key in g_session_table) {
        var session = g_session_table[key];
        if (! session.contact && session.nickname != mysession.nickname) {
            var to_contact = {"presence":{"from":mysession.nickname, "type":"online"}}; 
            var to_me = {"presence":{"from":session.nickname, "type":"online"}}; 

            session.contact = mysession.nickname;
            session.event_queue.push(to_contact);

            mysession.contact = session.nickname;
            mysession.event_queue.push(to_me);

            break;
        }
    }
}

//==============================================================================
// Service handlers

function indexHandler(req, res)
{
    res.render('index.haml');
}

//------------------------------------------------------------------------------

function connectHandler(req, res)
{
    var json_req = req.body;
    var nickname = json_req.nickname;
    var session_key = nickname;

    if (! nickname) {
        return res.send(403);
    }
    if (g_session_table[session_key]) {
        return res.send(403);
    }

    var ts = Number(new Date());
    var session_id = nickname + '-' + ts;
    var session = {
        "session_id":session_id,
        "nickname":nickname,
        "event_queue":new Array(),
        "contact":null
    };

    //-- create session...
    g_session_map[session_id] = session_key;
    g_session_table[session_key] = session;

    //-- send online...
    var to_me = {"presence":{"from":session.nickname, "type":"online"}}; 
    pushEvent(session.nickname, to_me);

    //-- random matchup...
    //doMatchup(session_key);

    var json_res = {"session_id":session_id};

    res.header('Content-Type', 'application/json');
    res.send(json_res);
}

//------------------------------------------------------------------------------

function disconnectHandler(req, res)
{
    var json_req = req.body;
    var session_id = json_req.session_id;

    if (! session_id) {
        return res.send(403);
    }
    if (! g_session_map[session_id]) {
        return res.send(404);
    }

    var session_key = g_session_map[session_id];
    var session = g_session_table[session_key];

    //-- send offline...
    var to_me = {"presence":{"from":session.nickname, "type":"offline"}}; 
    pushEvent(session.nickname, to_me);

    if (session.contact) {
        var to_contact = {"presence":{"from":session.nickname, "type":"offline"}}; 
        pushEvent(session.contact, to_contact);
    }

    var json_res = {};

    res.header('Content-Type', 'application/json');
    res.send(json_res);
}

//------------------------------------------------------------------------------

function sendHandler(req, res)
{
    var json_req = req.body;
    var session_id = json_req.session_id;
    
    if (! session_id) {
        return res.send(403);
    }
    if (! g_session_map[session_id]) {
        return res.send(404);
    }

    var session_key = g_session_map[session_id];
    var session = g_session_table[session_key];

    for (var e in json_req) {
        switch (e) {
            case 'message': 
                var message = json_req[e];
                var contact = message.to;
                var ts = Number(new Date());
                var to_contact = {"message":{"from":session.nickname, "text":message.text, "ts":ts}}; 

                pushEvent(contact, to_contact);
            break;
        }
    }

    var json_res = {};

    res.header('Content-Type', 'application/json');
    res.send(json_res);
}

//------------------------------------------------------------------------------

function recvHandler(req, res)
{
    var json_req = req.body;
    var session_id = json_req.session_id;

    if (! session_id) {
        return res.send(403);
    }
    if (! g_session_map[session_id]) {
        return res.send(404);
    }

    var session_key = g_session_map[session_id];
    var session = g_session_table[session_key];

    res.header('Content-Type', 'application/json');

    setTimeout(function(ctr) {
        var json_res = null;

        if (ctr == 30) {
            json_res = {};
        } else {
            var event_obj = popEvent(session_key); 

            //-- do extra processing for offline presence...
            for (var e in event_obj) {
                if (e == 'presence') {
                    var presence = event_obj[e];
                    if (presence.type == 'offline') {
                        if (presence.from == session.nickname) {
                            //-- destroy session...
                            delete g_session_table[session_key];
                            delete g_session_map[session_id];
                        } else {
                            //-- unset contact
                            session.contact = null;
                        }
                    }
                }
            }

            json_res = event_obj;
        }
        
        if (json_res) {
            res.send(json_res);
        } else {
            setTimeout(arguments.callee, 1000, ++ctr);
        }
    }, 0, 0);
}

//------------------------------------------------------------------------------

function searchHandler(req, res)
{
    var json_req = req.body;
    var session_id = json_req.session_id;
    
    if (! session_id) {
        return res.send(403);
    }
    if (! g_session_map[session_id]) {
        return res.send(404);
    }

    var session_key = g_session_map[session_id];
    var session = g_session_table[session_key];

    //-- send offline first...
    if (session.contact) {
        var to_contact = {"presence":{"from":session.nickname, "type":"offline"}}; 
        var to_me = {"presence":{"from":session.contact, "type":"offline"}}; 

        pushEvent(session.contact, to_contact);
        pushEvent(session.nickname, to_me);
    }

    //-- random matchup...
    doMatchup(session_key);

    var json_res = {};

    res.header('Content-Type', 'application/json');
    res.send(json_res);
}

//==============================================================================
// Main

var express = require('express');

//var app = express.createServer(
//        express.staticProvider(__dirname + '/public'),
//        express.bodyDecoder(),
//        express.logger()
//        );

var app = express.createServer();

//-- env settings
app.configure(function() {
        app.use(express.staticProvider(__dirname + '/public'));
        app.use(express.bodyDecoder());
        //app.use(express.logger());
        });

//-- services
app.get('/', indexHandler);
app.post('/connect', connectHandler);
app.post('/disconnect', disconnectHandler);
app.post('/send', sendHandler);
app.post('/recv', recvHandler);
app.post('/search', searchHandler);

//-- start server
app.listen(2020);
console.log('Chat Roulette server started on port %s', app.address().port);

//==============================================================================
