(function () {
    'use strict'
    if (typeof $ === 'undefined') {
        throw new Error('请先加载jQuery')
    }
    $(function () {
        var chat = document.querySelector('#czkj-chat')
        var allowChatRoll = true
        var httpRegex = /((?:https?|ftp|file):\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:\d+)?([-\w\u4e00-\u9fa5+&@#%?=~_\/|!:,.;]*)?/ig
        var strongRegex = /\*\*(.*?)\*\*/g;
        let userId = getUuid() //当前用户的唯一标识
        let sessionId = getUuid()//当前会话ID
        var limit = 100 
        var historicRecords = {
            maxLen: 15,
            value: []
        }
        var abortControllerSse = {abort: function() {}}, boolSse = true, sseEnd = true;
        var ie = !!window.ActiveXObject
        if (ie) {
            $('.czkj-textarea').bind('propertychang', function () {
                watchQuestion()
            })
        } else {
            $('.czkj-textarea').on('input', function (event) {
                watchQuestion()
            })
        }
        function watchQuestion() {
            var val = $('.czkj-textarea').val()
            if (!val) {
                $('.czkj-enter-btn').removeClass('actived')
            } else {
                $('.czkj-enter-btn').addClass('actived')
            }
           
        }
        var robotFootHtml = '</div></li>'
        var chatRagId
        var languageObj = {
            manyWords: '输入字数过多，请精简后咨询',
            youInformation: '请输入你的问题',
            timeout: '网络超时请稍后再尝试',
            chatgptTip: '请等机器人回复后再发送',
        }
        if (localStorage.historicRecordsVal) {
            var list = JSON.parse(decodeURI(localStorage.historicRecordsVal));
            for (var i = 0; i < list.length; i++) {
                $('.yzt-h-c-log').prepend('<div class="yzt-h-c-l-item "><div class="czkj-history-item" data-key=' + encodeURI(list[i]) + '>' + list[i] + '</div><span class="delHistory"></span></div>')
            }
        }
        $('#czkj-chat').append(robotHeadHtml('czkj-welcome-msg czkj-special-width') + '你好，这是深知智能MaaS服务知识模型开源前端，您可以在这里体验知识模型接口的问答效果。' + robotFootHtml)
        
        setAccessRag();//添加 深度解读(R1) 选项
        setPositioningz();//初始化地域

        $('.czkj-enter-btn').click(function () {//点击发送按钮
            var val = $('.czkj-textarea').val()
            if (!val) return
            sendMsg(val)
        })

        function setAccessRag() {
            let rag =  {
                "id": "R1",
                "name": "深度解读(R1)",
            };
            let ragHtml = '<div class="accessrag" data-id="'+ rag.id +'">'+ rag.name +'</div>';
            $('.czkj-chat-input').addClass('rag').append(ragHtml);
            $(document).on('click', '.accessrag', function() {
                $(this).toggleClass('active');
                chatRagId = undefined;               
                if($(this).hasClass('active')) chatRagId = $(this).data('id');
            })
            $('.accessrag').trigger('click')
        }

        //显示移动端操作栏
        $('.czkj-send').click(function () {
            var val = $('.czkj-textarea').val()
            if (val) {
                if (val.length > limit) {
                    errMsg(languageObj.manyWords)
                    return
                }
                sendMsg(val)
            }
        })

        //输入框回车事件
        $('.czkj-textarea').keydown(function (event) {
            if (event.which == 13) {
                event.preventDefault()
                var text = $('.czkj-textarea').val()
                if (!text) {
                    errMsg(languageObj.youInformation)
                    return
                }
                if (text.length > limit) {
                    errMsg(languageObj.manyWords)
                    return
                }
                $('.czkj-textarea').val('')
                sendMsg(text)
            }
        })

        //chat滚动到底部
        function chatScrollBottom() {
            setTimeout(function() {
                chat.scrollTop = chat.scrollHeight
            }, 0)
        }

        //参考资料涉及的事件
        $('.czkj-content-body').on('click', '.sup', function() {
            let obj = $(this).parents('.czkj-robot').find('.chatSseBtn'), text = $(this).text();
            if(obj.length) {
                obj.find('.btns').removeClass('active')
                obj.siblings('.chatsse-note').show().children('.chatsse-note-item').show()
                obj.siblings('.chatsse-note').find('.chatsse-note-item-head').removeClass('active')
                obj.siblings('.chatsse-note').find('.activeColor').removeClass('activeColor')
                obj.siblings('.chatsse-note').find('.chatsse-note-score').removeClass('box')
                obj.siblings('.chatsse-note').find('.chatsse-note-score-id').each(function() {
                    if($(this).text() == text) {
                        $(this).parent().addClass('activeColor');
                        $(this).parents('.chatsse-note-item').find('.chatsse-note-item-head').trigger('click');
                        $(this).parent()[0].scrollIntoView({ behavior: "smooth", block: "center"});
                    }
                })
            }
        })

        $('.czkj-content-body').on('click', '.chatSseBtn', function() {
            $(this).find('.btns').toggleClass('active')
            $(this).siblings('.chatsse-note').toggle()
            $(this).siblings('.chatsse-note').children('.chatsse-note-item').show()
        })

        $('.czkj-content-body').on('click', '.chatsse-note-item-head', function() {
            $(this).toggleClass('active')
            $(this).siblings('.chatsse-note-score').toggleClass('box')
        })

        $(document).on('click', '.waitTextContent', function() {
            $(this).toggleClass('active');
            $(this).parent().siblings('.reasoning_value').toggle()
        })

        //查看参考资料分段详情
        $('.czkj-content-body').on('click', '.chatsse-note-score', function(e) {
            $('.dg-modal').css('display', 'flex')
            $('.dg-modal-title').text($(this).siblings('.chatsse-note-item-head').find('.czkjNlpUrl').text())
            $('.dg-modal-content').html($(this).html())
        })

        $(document).on('click', '.dg-modal-del', function() {
            $('.dg-modal').hide()
        })

        //把问题添加到历史记录
        function addHistoricRecords(userInput) {
            if(!userInput) return;
            //判断是否需要push
            if (localStorage.historicRecordsVal) {
                historicRecords.value = JSON.parse(decodeURI(localStorage.historicRecordsVal))
            }
            for (var i = 0; i < historicRecords.value.length; i++) {
                if (historicRecords.value[i] === userInput) {
                    historicRecords.value.splice(i, 1)
                }
            }
            if (historicRecords.value.length >= historicRecords.maxLen) {
                historicRecords.value.shift()
            }
            historicRecords.value.push(userInput)
            $('.yzt-h-c-log').html('')
            var newArr = JSON.parse(JSON.stringify(historicRecords.value)).reverse()
            for (var i = 0; i < newArr.length; i++) {
                $('.yzt-h-c-log').append('<div class="yzt-h-c-l-item "><div class="czkj-history-item" data-key=' + encodeURI(newArr[i]) + '>' + newArr[i] + '</div><span class="delHistory"></span></div>');
            }
            localStorage.historicRecordsVal = encodeURI(JSON.stringify(historicRecords.value))
        }
       
        //发送消息
        function sendMsg(text) {
            if($('.stopChat').length || !sseEnd) {
                errMsg(languageObj.chatgptTip)
                return
            };
            $('.yzt-operate-del').removeClass('hide');
            text = ToDBC(text)
            text = text ? text.replace(/[\n]/g, '<br>') : ''
            var spaceText = text.replace(/ /g, '')
            if (!spaceText) {
                errMsg('请输入你的问题')
                return
            }
            appendUserMsg(text)
            var chatObj = {
                userId: userId,
                sessionId: sessionId,
                model: chatRagId,
                material: true,
                stream: true,
                sseAddStream: true,
                messages: [{
                    role: 'user',
                    content: text
                }]
            }
            if(selectAreaId) chatObj.area = $('.positioning-text').eq(0).text();
            let groupHtml = robotHeadHtml('chat-load-text') +  robotFootHtml;
            $('#czkj-chat').append(groupHtml)
            chatScrollBottom()
            allowChatRoll = true;
            if(window.EventSource) robotServerSseChat(chatObj, text);
        }

        function robotServerSseChat(chatObj, text) {
            abortControllerSse = {abort: function() {}};
            boolSse = true;
            var signalz = undefined;
            if(window.AbortController) {
                abortControllerSse = new AbortController();
                signalz = abortControllerSse.signal;
            }
            var classz = 'c' + Date.now();
            var sseHtml = '<div class="chatgpt-qa"> <div class="chatsse-content"><div class="chatsse-data chatSseBtn"><span class="names chatSseName"></span><span class="btns "></span></div><div class="chatsse-note"></div></div> <div class="waitText hide"><img src="img/sdsk.svg" alt=""><span class="waitTextContent">AI开始根据权威材料进行思考</span></div><div class="reasoning_value hide"></div> <div class="chatgpt-tips"></div> <span class="'+ classz +'"></span> <div class="stopChat">停止生成</div> </div>';
            let isSswFirst = true;
            let isSearchResult = true
            let urlz = robotSetting.chatUrl;
            let reasoningHtmlAll = '', contentHtmlAll = '';
            $('.chat-stop').addClass('active');
            allowChatRoll = true;
            fetch(urlz, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(chatObj),
                signal: signalz
            })
            .then(function(response) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';
                function processStreamResult(result2) {
                    const chunk = decoder.decode(result2.value, { stream: !result2.done });
                    buffer += chunk;
                    //逐条解析后端返回数据
                    const lines = buffer.split('\n');
                    buffer = lines.pop();
                    lines.forEach(function(line) {
                        if (line.trim().length > 0) {
                            if(line != 'data: [DONE]'){
                                sseEnd = false;
                                //执行完成的页面逻辑
                                let datass = JSON.parse(line.substring(5));
                                let choices = datass.choices && datass.choices[0] || {}
                                //console.log(choices);
                                if(choices.message && choices.message.waitText) {
                                    $('.chat-load-text').last().find('.chatwc').show().siblings('.chatjz').remove();
                                    $('.chat-load-text').last().find('.czkj-msg').append('<div class="load-item"><img class="chatjz" src="img/chatjz.gif" alt=""><img class="chatwc hide" src="img/chatwc.svg" alt="">'+ choices.message.waitText +'</div>');
                                    chatScrollBottom()
                                }
                                let searchResult = datass.referenceMaterials || [];
                                if((choices.message && (choices.message.reasoning_content || choices.message.content)) || (searchResult.length && isSearchResult)) {
                                    if(isSswFirst) {
                                        isSswFirst = false;
                                        $('.chat-load-text').last().find('.chatwc').show().siblings('.chatjz').remove();
                                        $('#czkj-chat').append(robotHeadHtml('czkj-sse') + sseHtml + robotFootHtml);
                                        $('.stopChat').off('click').on('click', function () {
                                            boolSse = false;
                                            $(this).text('已停止生成').addClass('stopChatActive').removeClass('stopChat');
                                            
                                            abortControllerSse.abort();
                                        })
                                    }
                                    if(searchResult.length && isSearchResult) {
                                        isSearchResult = false;
                                        $('.' + classz).parents('.czkj-msg').find('.chatsse-content').show()
                                        $('.' + classz).parents('.czkj-msg').find('.chatSseName').text('共获取'+ searchResult.length +'份资料，资料解析中...');
                                        let htmls = ''
                                        searchResult.forEach(function(item) {
                                            htmls += '<div class="chatsse-note-item"><div class="chatsse-note-item-head"><span class="chatsse-note-item-arrow"></span><span class="czkjNlpUrl pointer">'+ item.title + '</span></div>';
                                            item.content && item.content.forEach(function(ite) {
                                                htmls += '<div class="chatsse-note-score hide"><span class="chatsse-note-score-id">'+ ite.id +'</span>'+ ite.text +'</div>'
                                            })
                                            htmls += '</div>'
                                        })
                                        
                                        $('.' + classz).parents('.czkj-msg').find('.chatsse-note').html(htmls).hide()
                                        $('.' + classz).parents('.czkj-msg').find('.chatSseBtn').css('display', 'flex').find('.btns').addClass('active')
                                    }

                                    if(choices.message && choices.message.reasoning_content) {
                                        let reasoningHtml = choices.message.reasoning_content, reasoningArry = [];
                                        reasoningHtml = reasoningHtmlAll + reasoningHtml;
                                        reasoningHtmlAll = reasoningHtml;
                                        reasoningArry = reasoningHtml.match(/\[\^[0-9|\,]+\^\]/ig) || [];
                                        reasoningArry.forEach(function(items){
                                            var itemhtml = '';
                                            var itemarry = items.substring(2, items.length - 2).split(',')
                                            itemarry.forEach(function(ite){
                                                itemhtml += '<sup class="sup">'+ ite +'</sup>'
                                            })
                                            reasoningHtml = reasoningHtml.replace(items, itemhtml)
                                        })
                                        $('.' + classz).siblings('.reasoning_value').html(reasoningHtml).show()
                                        $('.' + classz).siblings('.waitText').show()
                                    }
                                   
                                    if(choices.message && choices.message.tip) {
                                        $('.' + classz).siblings('.chatgpt-tips').html(choices.message.tip);
                                    }

                                    if(choices.message && choices.message.content) {
                                        let contentHtml = choices.message.content, contentArry = [];
                                        contentHtml = contentHtmlAll + contentHtml;
                                        contentHtmlAll = contentHtml;
                                        if(window.marked) {
                                            if(contentHtml.replaceAll) {
                                                contentHtml = contentHtml.replaceAll(strongRegex, function(url) {
                                                    return ' '+ url + ' '
                                                })
                                                contentHtml = contentHtml.replaceAll('. ', '.').replaceAll('.**', '. **').replaceAll('-  **', '- **');
                                                contentHtml = contentHtml.replaceAll(httpRegex, function(url) {
                                                    if(url.endsWith && url.endsWith('=')) return url;
                                                    return url + ' '
                                                })
                                            }
                                            contentHtml = marked.marked(contentHtml.replace(/<br\s*\/>\|/gi, '\n|').replace(/\|<br\s*\/>/gi, '|\n\n'));
                                            if(contentHtml.replaceAll) contentHtml = contentHtml.replaceAll('</strong> ', '</strong>').replaceAll(' <strong>', '<strong>');
                                        }
                                        contentArry = contentHtml.match(/\[\^[0-9|\,]+\^\]/ig) || [];
                                        contentArry.forEach(function(items){
                                            var itemhtml = '';
                                            var itemarry = items.substring(2, items.length - 2).split(',')
                                            itemarry.forEach(function(ite){
                                                itemhtml += '<sup class="sup">'+ ite +'</sup>'
                                            })
                                            contentHtml = contentHtml.replace(items, itemhtml)
                                        })
                                        $('.' + classz).html(contentHtml);
                                    }
                                    if(allowChatRoll) chat.scrollTop = chat.scrollHeight;
                                }
                            }
                        }
                    });
                    if (!result2.done && boolSse) {
                        return reader.read().then(processStreamResult);
                    }else {
                        console.log('结束');
                        addHistoricRecords(text);
                        $('.' + classz).siblings('.reasoning_value').hide()
                        $('.' + classz).siblings('.waitText').find('.waitTextContent').addClass('active')
                        //$('#czkj-chat').children('.chat-load-text').addClass('hide')
                        if(!boolSse) {
                            $('.stopChat').remove()
                            return
                        }
                        sseEnd = true;
                        $('.stopChat').remove()
                        $('.' + classz).parents('.czkj-msg').find('.chatSseName').text('共获取'+ $('.' + classz).parents('.czkj-msg').find('.chatsse-note-item').length +'份资料');
                        let chatOperateHtml = '<div class="czkj-chat-copy" data-classz="' + classz + '"><span class="chatgpt-copy pointer" title="复制"></span></div>';
                        $('.' + classz).parents('.czkj-msg').append(chatOperateHtml);
                        setTimeout(function () {
                            if(allowChatRoll) chat.scrollTop = chat.scrollHeight;
                        }, 0);
                    }
                }
                return reader.read().then(processStreamResult);
            })
            .catch(function(error) {
                console.log('error', error)
                addHistoricRecords(text)
                sseEnd = true
                if(boolSse) errMsg(languageObj.timeout)
                $('.stopChat').remove()
                //$('#czkj-chat').children('.chat-load-text').addClass('hide')

            });
        }

        //新增用户信息
        function appendUserMsg(msg) {
            if (!msg) return;
            var html = '<li class="czkj-user">' +
                '<div class="czkj-avatar czkj-user-avatar"></div>' +
                '<div class="czkj-msg">'
                + msg + '</div></li>'
            $('#czkj-chat').append(html)
            $('.czkj-textarea').val('')
            chatScroll()
        }

        //退出对话
        $('.yzt-operate-del').click(function () {
            $('.czkj-welcome-msg').nextAll().remove();
            sessionId = getUuid()
            $('.yzt-operate-del').addClass('hide');
            boolSse = false;
            abortControllerSse.abort();
        })

        //点击历史记录
        $(document).on('click', '.czkj-history-item', function (e) {
            var key = $(e.target).data('key')
            if (key) {
                sendMsg(String(decodeURI(key)))
            }
        })

        //删除历史记录
        $(document).on('click', '.delHistory', function () {
            $(this).parent().remove();
            var list = JSON.parse(decodeURI(localStorage.historicRecordsVal));
            var arrys = []
            var that = $(this);
            arrys = list.filter(function (it) {
                return it !== that.siblings('div').text()
            })
            localStorage.historicRecordsVal = encodeURI(JSON.stringify(arrys))
        })

        //内容区域滚动
        $('#czkj-chat').on('scroll', function (e) {
            if(chat.scrollHeight - chat.offsetHeight - chat.scrollTop > 60) {
                allowChatRoll = false;
            }else {
                allowChatRoll = true;
            }
        })

        //移动端菜单点击事件---历史记录
        $('.czkj-mobile-history').click(function (e) {
            if(!sseEnd) return;
            var html = '<div class="czkj-mobile-common-title"><i></i>历史记录<div class="czkj-history-del"><img src="./img/history-del.svg">清空</div></div>'
            if (localStorage.historicRecordsVal) {
                var list = JSON.parse(decodeURI(localStorage.historicRecordsVal))
                for (var i = 0; i < list.length; i++) {
                    html += '<div class="czkj-recommend-item" data-key=' + list[i] + '>' + list[i] + '</div>'
                }
            } else {
                html = '<div class="no-histroy">暂无历史记录</div>'
            }
            $('#czkj-chat').append(robotHeadHtml('czkj-special-width') + html + robotFootHtml)
            chatScrollBottom()
        })

        // 清空历史记录
        $(document).on('click', '.czkj-history-del', function (e) {
            localStorage.historicRecordsVal = ''
            historicRecords.value = []
            var html = '<div class="no-histroy">暂无历史记录</div>'
            $(this).parents('.czkj-msg').html(html)
        })

        //历史记录点击
        $(document).on('click', '.czkj-recommend-item', function (e) {
            var contents = $(e.target).text()
            if (contents) {
                sendMsg(String(contents))
            }
        })

        //errmodal提示框
        function errMsg(msg) {
            $('.czkj-err-msg').css('top', '20px').html(msg)
            setTimeout(function () {
                $('.czkj-err-msg').css('top', '-80px')
            }, 4000)
        }

        //滚动记录
        function chatScroll() {
            var user = $('#czkj-chat .czkj-user')
            var last = user[user.length - 1]
            if (last) {
                chat.scrollTop = last.offsetTop - 10
            }
        }

        function robotHeadHtml(className, noAvatar) {
            className = className || ''
            var avatar = noAvatar ? '' : ('<div class="czkj-avatar czkj-robot-avatar"><img src="./img/user-icon.png"></div>')
            return '<li class="czkj-robot ' + className + '">' + avatar + '<div class="czkj-msg">'
        }

        //复制
        $(document).on('click', '.chatgpt-copy', function (e) {
            var divs = $('<div></div>')
            divs.html($('.' + $(this).parent().data('classz')).html()).find('.sup').remove();
            var htmlcc = divs.text()
            var clipboard = new ClipboardJS(this, {
                text: function () {
                    errMsg('复制成功')
                    return htmlcc
                }
            })
            clipboard.on('success', function (e) {
                e.clearSelection()
                errMsg('复制成功')
            })
            clipboard.on('error', function () {
            })
            this.click()
            clipboard.destroy()
        })

        function ToDBC(txtstring) {
            var tmp = ''
            for (var i = 0; i < txtstring.length; i++) {
                if (txtstring.charCodeAt(i) === 60 || txtstring.charCodeAt(i) === 62) {
                    tmp += String.fromCharCode(txtstring.charCodeAt(i) + 65248)
                } else {
                    tmp += txtstring[i]
                }
            }
            return tmp
        }
       
        function getUuid() {
            let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
            let uuid = []
            let i
            var r
            uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
            uuid[14] = '4'
            for (i = 0; i < 36; i++) {
                if (!uuid[i]) {
                    r = 0 | Math.random() * 16
                    uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r]
                }
            }
            return uuid.join('')
        }
    })
})(window)
