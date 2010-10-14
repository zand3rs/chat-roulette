/*
 *    ____  |
 *         /     Author  : Alexander A. Magtipon
 *       /       Created : 2010-10-07
 *     /         Updated : 2010-10-07
 *  _______|     Remarks : zander - zand3rs@gmail.com
 *
 *
 * Filename    : chat.js
 * Description : Chat Roulette Client
 *
 * Copyright   : (c)
 *
 *
 * $Id$
 */

/******************************************************************************/


//==============================================================================
// globals...

var g_session_id = '';
var g_connected = false;

//==============================================================================

function doConnected()
{
    g_connected = true;

    $('#spanStatus').html('Connected');

    $('#btnExec').val('Disconnect');
    $('#btnExec').attr('disabled', false);
    $('#btnSearch').attr('disabled', false);
}

//------------------------------------------------------------------------------

function doDisconnected()
{
    g_connected = false;
    g_session_id = '';

    $('#spanStatus').html('Disconnected');

    $('#btnExec').val('Connect');
    $('#btnExec').attr('disabled', false);
    $('#btnSearch').attr('disabled', true);

    $('#txtNickname').attr('disabled', false);
    $('#txtMessage').attr('disabled', true);
    $('#btnSend').attr('disabled', true);
}

//==============================================================================

function sendConnect()
{
    var nickname = jQuery.trim($('#txtNickname').val());
    if (! nickname || nickname == '') {
        return;
    }

    $('#spanStatus').html('Connecting...');
    $('#btnExec').attr('disabled', true);
    $('#txtNickname').attr('disabled', true);

    var service = '/connect';
    var jsonObj = {
        "nickname": nickname
    };

    var jsonReq = JSON.stringify(jsonObj);
    var successHandler = connectSuccessHandler;
    var errorHandler = connectErrorHandler;

    doAjax(service, jsonReq, successHandler, errorHandler);
}

//------------------------------------------------------------------------------

function sendDisconnect()
{
    $('#spanStatus').html('Disconnecting...');
    $('#btnExec').attr('disabled', true);

    var service = '/disconnect';
    var jsonObj = {
        "session_id": g_session_id
    };

    var jsonReq = JSON.stringify(jsonObj);
    var successHandler = disconnectSuccessHandler;
    var errorHandler = disconnectErrorHandler;

    doAjax(service, jsonReq, successHandler, errorHandler);
}

//------------------------------------------------------------------------------

function sendMessage()
{
    var contact = $('#txtTo').val();
    var message = $('#txtMessage').val();

    contact = jQuery.trim(contact);
    message = jQuery.trim(message);
    if (! contact || contact == '') {
        return;
    }
    if (! message || message == '') {
        return;
    }

    var service = '/send';
    var jsonObj = {
        "session_id": g_session_id,
        "message": {
            "to": contact,
            "text": message
        }
    };

    var jsonReq = JSON.stringify(jsonObj);
    var successHandler = sendSuccessHandler;
    var errorHandler = sendErrorHandler;

    var nickname = $('#txtNickname').val();
    var now = new Date();
    var ts = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

    var messageHtml = '<div class="sender"><h1><span style="float:left">' + nickname
        + '</span>' + ts + '</h1><p>' + message + '</p></div>';

    $('#txtMessage').val('');
    $('.conv').append(messageHtml);
    $(".conv").attr({scrollTop: $(".conv").attr("scrollHeight")});

    doAjax(service, jsonReq, successHandler, errorHandler);
}

//------------------------------------------------------------------------------

function sendRecv()
{
    var service = '/recv';
    var jsonObj = {
        "session_id": g_session_id
    };

    var jsonReq = JSON.stringify(jsonObj);
    var successHandler = recvSuccessHandler;
    var errorHandler = recvErrorHandler;

    doAjax(service, jsonReq, successHandler, errorHandler);
}

//------------------------------------------------------------------------------

function sendSearch()
{
    $('#btnSearch').attr('disabled', true);

    var service = '/search';
    var jsonObj = {
        "session_id": g_session_id
    };

    var jsonReq = JSON.stringify(jsonObj);
    var successHandler = searchSuccessHandler;
    var errorHandler = searchErrorHandler;

    doAjax(service, jsonReq, successHandler, errorHandler);
}

//==============================================================================

function connectSuccessHandler(res, desc, req)
{
    if (! req.status) {
        var confirmMsg = "Unable to connect!\nWould you like to try again?\n";
        var ans = confirm(confirmMsg);
        if (ans) {
            $(document).oneTime(2000, function() {
                    sendConnect();
                    });
        } else {
            doDisconnected();
        }
        return;
    }

    var jsonObj = JSON.parse(res);
    g_session_id = jsonObj.session_id;

    sendRecv();
}

//------------------------------------------------------------------------------

function connectErrorHandler(req, err)
{
    var debugMsg = "\n\n=== DEBUG ===\n"
        + 'ajax status: ' + err + "\n"
        + 'http status: ' + req.status + "\n"
        + 'http response: ' + req.responseText + "\n";

    switch (err) {
        case 'timeout':
            break;
        case 'error':
            break;
        case 'notmodified':
            break;
        case 'parsererror':
            break;
        default:
            break;
    }

    var confirmMsg = 'Unable to connect!' + debugMsg + 'Would you like to try again?';
    var ans = confirm(confirmMsg);
    if (ans) {
        $(document).oneTime(2000, function() {
                sendConnect();
                });
    } else {
        doDisconnected();
    }
}

//------------------------------------------------------------------------------

function disconnectSuccessHandler(res, desc, req)
{
    if (! req.status || ! res || res == '') {
        doDisconnected();
    }
}

//------------------------------------------------------------------------------

function disconnectErrorHandler(req, err)
{
    doDisconnected();

    var debugMsg = "\n\n=== DEBUG ===\n"
        + 'ajax status: ' + err + "\n"
        + 'http status: ' + req.status + "\n"
        + 'http response: ' + req.responseText + "\n";

    switch (err) {
        case 'timeout':
            break;
        case 'error':
            break;
        case 'notmodified':
            break;
        case 'parsererror':
            break;
        default:
            break;
    }

    var alertMsg = 'An error has occured!' + debugMsg;
    alert(alertMsg);

}

//------------------------------------------------------------------------------

function sendSuccessHandler(res)
{
    //alert(res);
}

//------------------------------------------------------------------------------

function sendErrorHandler(req, err)
{
    var debugMsg = "\n\n=== DEBUG ===\n"
        + 'ajax status: ' + err + "\n"
        + 'http status: ' + req.status + "\n"
        + 'http response: ' + req.responseText + "\n";

    switch (err) {
        case 'timeout':
            break;
        case 'error':
            break;
        case 'notmodified':
            break;
        case 'parsererror':
            break;
        default:
            break;
    }

    var alertMsg = 'An error has occured!' + debugMsg;
    alert(alertMsg);
}

//------------------------------------------------------------------------------

function recvSuccessHandler(res, desc, req)
{
    if (! req.status || ! res || res == '') {
        if (g_connected) {
            sendDisconnect();
        }
        return;
    }

    res = jQuery.trim(res);
    try {
        var jsonObj = JSON.parse(res);
    } catch (e) {
        var jsonObj = {};
    }

    for (var e in jsonObj) {
        switch (e) {
            case 'message':
                var message = jsonObj[e];
                var now = new Date();
                var ts = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
                var messageHtml = '<div class="receiver"><h1><span style="float:left">' + message.from
                    + '</span>' + ts + '</h1><p>' + message.text + '</p></div>';

                $('.conv').append(messageHtml);
                $('.conv').attr({scrollTop: $('.conv').attr('scrollHeight')});
                break;
            case 'presence':
                var presence = jsonObj[e];
                var now = new Date();
                var ts = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
                var messageHtml = '<div class="system"><h1>' + ts + '</h1><p>' +  presence.from
                    + ' ' + presence.type + '</p></div>';

                $('.conv').append(messageHtml);
                $('.conv').attr({scrollTop: $('.conv').attr('scrollHeight')});
                $('#txtTo').val('');

                switch (presence.type) {
                    case 'online':
                        if (presence.from == $('#txtNickname').val()) {
                            doConnected();
                        } else {
                            $('#txtTo').val(presence.from);
                            $('#txtMessage').attr('disabled', false);
                            $('#btnSend').attr('disabled', false);
                        }
                        break;
                    case 'offline':
                        if (presence.from == $('#txtNickname').val()) {
                            doDisconnected();
                        } else {
                            $('#txtMessage').attr('disabled', true);
                            $('#btnSend').attr('disabled', true);
                        }
                        break;
                }
                break;
        }
    }

    if (g_connected) {
        sendRecv();
    }
}

//------------------------------------------------------------------------------

function recvErrorHandler(req, err)
{
    if (g_connected) {
        sendDisconnect();
    }
}

//------------------------------------------------------------------------------

function searchSuccessHandler(res, desc, req)
{
    $('#btnSearch').attr('disabled', false);
}

//------------------------------------------------------------------------------

function searchErrorHandler(req, err)
{
    $('#btnSearch').attr('disabled', false);

    var debugMsg = "\n\n=== DEBUG ===\n"
        + 'ajax status: ' + err + "\n"
        + 'http status: ' + req.status + "\n"
        + 'http response: ' + req.responseText + "\n";

    switch (err) {
        case 'timeout':
            break;
        case 'error':
            break;
        case 'notmodified':
            break;
        case 'parsererror':
            break;
        default:
            break;
    }

    var alertMsg = 'An error has occured!' + debugMsg;
    alert(alertMsg);
}

//==============================================================================

function doAjax(url, data, success, error)
{
    $.ajax({
        type: 'POST',
        contentType: 'application/json',
        processData: false,
        dataType: 'text',
        timeout: 60000,
        url: url,
        data: data,
        success: success,
        error: error,
    });
}

//==============================================================================

$(document).ready(function() {

        //-- disable page refresh (F5 - 116)
        //$(document).keydown(function(event) {
        //    if (event.keyCode == '116') {
        //        event.preventDefault();
        //        event.stopPropagation();
        //    }
        //    });

        //-- disable enter key (13)
        $('#txtNickname').keydown(function(event) {
            if (event.keyCode == '13') {
                event.preventDefault();
                event.stopPropagation();
            }
            });

        $('#txtMessage').keydown(function(event) {
            if (event.keyCode == '13') {
                event.preventDefault();
                event.stopPropagation();
                sendMessage();
            }
            });

        $('#btnSend').click(function() {
                sendMessage();
            });

        $('#btnSearch').click(function() {
                sendSearch();
            });

        $('#btnExec').click(function() {
                if ($('#btnExec').val() == 'Connect') {
                    sendConnect();
                } else {
                    if (g_connected) {
                        sendDisconnect();
                    }
                }
            });

        $('#btnClear').click(function() {
                $('.conv').html('');
            });

        $(window).bind('beforeunload', function() {
            if (g_connected) {
                sendDisconnect();
            }
            });

        });

//==============================================================================
