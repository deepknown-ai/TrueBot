<template>
  <div class="czkj-content-body clearfix">
    <div class="czkj-content-all czkj-container">
      <div class="czkj-content">
        <div class="czkj-chat-body">
          <div class="zhipu-title">
            <span class="czkj-logo-name">深知开源知识模型</span>
            <span class="czkj-logo-positioning" @click="showPositioningModal">
              <img src="@/assets/img/positioning.svg" alt="">
              <span class="positioning-text">{{ selectedAreaName }}</span>
            </span>
          </div>

          <!-- 聊天历史记录面板 -->
          <div class="yzt-history" :class="{ hide: !showHistory }">
            <div class="yzt-history-title">
              <span class="czkj-logo-name">深知开源知识模型</span>
              <span class="czkj-logo-positioning" @click="showPositioningModal">
                <img src="@/assets/img/positioning.svg" alt="">
                <span class="positioning-text">{{ selectedAreaName }}</span>
              </span>
            </div>
            <div class="yzt-history-content">
              <div class="yzt-h-c-title">
                <img src="@/assets/img/question.svg" alt="问题图标">提问记录
              </div>
              <div class="yzt-h-c-log">
                <div v-for="(record, index) in historicRecords" :key="index" class="yzt-h-c-l-item">
                  <div class="czkj-history-item" :data-key="encodeURI(record)" @click="selectHistoryRecord(record)">{{
              record }}</div>
                  <span class="delHistory" @click.stop="deleteHistoryRecord(index)"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 模态框 -->
          <div class="dg-modal" :style="{ display: showModal ? 'flex' : 'none' }">
            <div class="dg-modal-body">
              <div class="dg-modal-title">{{ modalTitle }}</div>
              <div class="dg-modal-content">{{ modalContent }}</div>
              <div class="dg-modal-del" @click="hideModal">关 闭</div>
            </div>
          </div>

          <!-- 聊天中心区域 -->
          <div class="czkj-chat-center">
            <div class="czkj-chat-left">
              <!-- 聊天消息区域 -->
              <ul ref="chatContainer" id="czkj-chat" class="base-scroll no-user-icon" @scroll="handleScroll">
                <div v-for="(message, index) in chatMessages" :key="index">
                  <li v-if="message.type === 'robot-message'" class="czkj-robot chat-load-text">
                    <div class="czkj-avatar czkj-robot-avatar"><img src="@/assets/img/user-icon.png"></div>
                    <div class="czkj-msg" style="margin-bottom: 15px;" v-if="message.load">
                      <div class="load-item" v-for="ite in message.load">
                        <img class="chatwc" src="@/assets/img/chatjz.gif" alt="" v-if="ite.flag">
                        <img class="chatwc" src="@/assets/img/chatwc.svg" alt="" v-else>
                        {{ ite.value }}
                      </div>
                    </div>

                    <div class="czkj-msg" style="clear: both;" v-if="message.reasoning_value || message.content">

                      <div class="chatgpt-qa">
                        <div class="chatsse-content" v-if="message.chatSseName">
                          <div class="chatsse-data chatSseBtn" @click="chatSseChange(message)">
                            <span class="names chatSseName">{{ message.chatSseName }}</span>
                            <span class="btns " :class="{ 'active': message.chatSseFlag }"></span>
                          </div>
                          <div class="chatsse-note" :class="{ 'active': message.chatSseFlag }">

                            <div class="chatsse-note-item" v-for="(item, index) in message.chatSseNote">
                              <div class="chatsse-note-item-head" :class="{ 'active': item.flag }"
                                @click="chatSseNoteChange(item)">
                                <span class="chatsse-note-item-arrow"></span>
                                <span class="czkjNlpUrl pointer">{{ item.title }}</span>
                              </div>
                              <div class="chatsse-note-score hide " :class="{ 'box': item.flag }"
                                v-for="(ite) in item.content">
                                <span class="chatsse-note-score-id"
                                  @click="showModalWithContent(item.title, ite.text)">{{ ite.id }}</span>{{ ite.text }}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="waitText hide" v-if="message.wait">
                          <img src="@/assets/img/sdsk.svg" alt="">
                          <span class="waitTextContent" :class="{ 'active': message.waitFlag }">AI开始根据权威材料进行思考</span>
                        </div>
                        <div class="reasoning_value" v-html="message.reasoning_value" v-show="!message.waitFlag"></div>
                        <div class="chatgpt-tips" v-if="message.tip">{{ message.tip }}</div>
                        <span class="'+ classz +'" v-html="message.content"></span>
                        <div class="stopChat" v-if="message.stop === 1" @click="stopSSE(message)">停止生成</div>
                        <div class="stopChatActive" v-if="message.stop === 2">已停止生成</div>
                      </div>

                      <div class="czkj-chat-copy" v-if="message.copy"><span class="chatgpt-copy pointer"
                          @click="copyMessage(message)" title="复制"></span></div>
                    </div>

                    <div class="recommend-matter" v-if="message.recommendation && message.recommendation.length">
                      <div class="title">推荐事项</div>
                      <div class="content">
                        <div class="item " :class="{hasBtn: item.onlineProcessUrls && item.onlineProcessUrls.length}"  v-for="item in message.recommendation">
                          <span class="name" @click="goExternalUrl(item.sourceUrl)" :class="{active: item.sourceUrl}">
                            {{ item.title }}
                          </span>
                          <span class="unit">
                            <span class="left">实施单位：</span>
                            <span class="right">{{ item.unit}}</span>
                          </span>
                          <span class="target" v-if="item.itemCategory">
                            <span class="left">服务对象：</span>
                            <span class="right">{{ item.itemCategory }}</span>
                          </span>
                          <span class="btn"  @click="goExternalUrl(item.onlineProcessUrls[0])" v-if="item.onlineProcessUrls && item.onlineProcessUrls.length" 
                            :data-url="item.onlineProcessUrls[0]">
                            一键办理<img alt="" src="@/assets/img/matter-bl.svg">
                          </span>
                        </div>
                      </div>
                      <!-- <span class="recommend-matter-left hide"></span> 
                        <span class="recommend-matter-right hide"></span> -->
                    </div>

                  </li>
                  <li v-if="message.type === 'user-message'" class="czkj-user">
                    <div class="czkj-msg" v-text="message.content"></div>
                  </li>
                </div>
              </ul>

              <!-- 聊天输入区域 -->
              <div class="czkj-chat-input">
                <textarea v-model="question" @input="watchQuestion" @keydown.enter="handleEnterKey"
                  class="czkj-textarea" placeholder="请输入您想咨询的内容"></textarea>
                <div class="czkj-send" @click="sendMessage"></div>
                <div :class="['czkj-enter-btn', { actived: question.length > 0 }]" @click="sendMessage"></div>

                <div class="czkj-chatsse-info" v-if="exitChat">
                  <div class="yzt-caht-del yzt-operate-del" @click="delChatMessages">
                    <img src="@/assets/img/exit.svg" alt="">
                    <span class="chatDelText">退出对话</span>
                  </div>
                </div>

                <!-- 联网搜索和深度解读选项 -->
                <div v-if="showRagOptions" class="rag-options">
                  <div class="accessrag" :class="{ active: useRag }" @click="toggleRag">深度解读(R1)</div>
                  <div class="websearch" :class="{ active: useWebSearch }" @click="toggleWebSearch">联网搜索</div>
                </div>
              </div>

            </div>

            <!-- 提示信息 -->
            <div class="zhipu-tip zhipuTitleColor chatZhipuTip">
              智能问答根据您的提问意图理解，答案内容为 AI 生成，不代表开发者立场，请勿删除或修改本标记。
            </div>
          </div>
        </div>
      </div>

      <!-- 错误消息 -->
      <div class="czkj-err-msg" :class="{ show: errorMessage }">{{ errorMessage }}</div>

      <!-- 地域选择模态框 -->
      <div class="czkj-robot-positioning-modal" :style="{ display: showPositioning ? 'block' : 'none' }">
        <div class="czkj-positioning-modal-content">
          <div class="czkj-positioning-modal-title">
            <div class="czkj-positioning-modal-name">请选择您的所在区域</div>
            <div class="czkj-positioning-tools" @click="hidePositioningModal"><img src="@/assets/img/close1.svg"
                alt="关闭图标"></div>
          </div>
          <div class="czkj-positioning-modal-body">
            <div class="czkj-positioning-modal-select">
              <span v-for="(itema, index) in selectedAreas" class="areaBack"
                @click="areaBack(itema, index)">{{ itema.name }}</span>
            </div>
            <div class="czkj-positioning-modal-data">
              <span v-for="itemb in currentAreas" :class="{ 'active': itemb.active }" class="setAreaId"
                @click="selectChange(itemb)">{{ itemb.name }}</span>
            </div>
            <div class="czkj-positioning-modal-btn">
              <span :class="['czkj-positioning-determine']" @click="confirmArea">确定</span>
              <span class="czkj-positioning-cancel" @click="hidePositioningModal">取消</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import areaData from './js/area.js';
import robotSetting from './js/config.js';
import { marked } from 'marked'
import useClipboard from 'vue-clipboard3';
const { toClipboard } = useClipboard();
const getUuid = () => {
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
};

// 状态管理
const question = ref('');
const chatMessages = ref([]);
const historicRecords = ref([]);
const errorMessage = ref('');
const showModal = ref(false);
const modalTitle = ref('');
const modalContent = ref('');
const showPositioning = ref(false);
const selectedAreaId = ref(11);
const selectedAreaName = ref('');
const selectedAreas = ref([]);
const currentAreas = ref([]);
const chatContainer = ref(null);
const showHistory = ref(false);
const useRag = ref(true);
const useWebSearch = ref(true);
const showRagOptions = ref(true);
const exitChat = ref(false);
const boolSse = ref(true);
const sseEnd = ref(true);
const selectedAreaLongName = ref('');
const allowChatRoll = ref(true);


let abortControllerSse = {};
let sessionId = getUuid()

const handleScroll = () => {
  if (!chatContainer.value) return;
  const isBottom = chatContainer.value.scrollHeight - chatContainer.value.scrollTop - chatContainer.value.offsetHeight > 60;
  if (isBottom) {
    allowChatRoll.value = false
  }else {
    allowChatRoll.value = true
  }
};

const goExternalUrl = (urls) => {
  urls && window.open(urls)
} 

const copyMessage = async (message) => {
  try {
    showErrorMessage('复制成功')
    toClipboard(message.content.replace(/<[^>]*>/g, ''));
  } catch (e) {
    console.error(e);
  }
};


const stopSSE = (message) => {
  message.stop = 2
  boolSse.value = false;
  abortControllerSse.abort && abortControllerSse.abort();
}

const delChatMessages = () => {
  chatMessages.value.splice(1)
  sessionId = getUuid()
  exitChat.value = false
  boolSse.value = false;
  abortControllerSse.abort && abortControllerSse.abort();
}

const chatSseNoteChange = (item) => {
  item.flag = !item.flag
}

const chatSseChange = (message) => {
  message.chatSseFlag = !message.chatSseFlag
}
// 初始化函数
const initApp = () => {
  setPositioningz();
  loadHistoricRecords();
  addWelcomeMessage();
};

// 加载历史记录
const loadHistoricRecords = () => {
  if (localStorage.historicRecordsVal) {
    historicRecords.value = JSON.parse(decodeURI(localStorage.historicRecordsVal));
  }
};

// 添加欢迎消息
const addWelcomeMessage = () => {
  chatMessages.value.push({
    type: 'robot-message',
    content: '你好，这是深知智能MaaS服务知识模型开源前端，您可以在这里体验知识模型接口的问答效果。'
  });
  scrollToBottom();
};

// 监听问题输入
const watchQuestion = () => {
  if (!question.value) {
    document.querySelector('.czkj-enter-btn').classList.remove('actived');
  } else {
    document.querySelector('.czkj-enter-btn').classList.add('actived');
  }
};

// 处理Enter键
const handleEnterKey = (event) => {
  if (!event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

// 添加历史记录
const addHistoricRecords = (userInput) => {
  if (!userInput) return;
  const index = historicRecords.value.indexOf(userInput);
  if (index !== -1) {
    historicRecords.value.splice(index, 1);
  }
  if (historicRecords.value.length >= 15) {
    historicRecords.value.shift();
  }
  historicRecords.value.unshift(userInput);
  localStorage.historicRecordsVal = encodeURI(JSON.stringify(historicRecords.value));
};

// 发送消息
const sendMessage = async () => {
  if (!question.value.trim()) {
    showErrorMessage('请输入问题内容');
    return;
  }

  if (question.value.length > 100) {
    showErrorMessage('输入字数过多，请精简后咨询');
    return;
  }

  if (!sseEnd.value) {
    showErrorMessage('请等机器人回复后再发送');
    return;
  }

  exitChat.value = true

  const userMessage = question.value.trim();

  // 添加用户消息到聊天窗口
  chatMessages.value.push({
    type: 'user-message',
    content: userMessage
  });


  // 清空输入框
  question.value = '';

  // 滚动到底部
  scrollToBottom();

  try {
    // 模拟API请求
    const chatObj = {
      userId: getUuid(),
      sessionId: sessionId,
      model: useRag.value ? 'R1' : undefined,
      search: useWebSearch.value,
      material: true,
      stream: true,
      item: true,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    };
    if (selectedAreaId.value) chatObj.area = selectedAreaName.value;
    robotServerSseChat(chatObj, userMessage)

    scrollToBottom();
  } catch (error) {
    // 移除加载状态
    chatMessages.value.pop();

    showErrorMessage('抱歉，发生错误，请重试');
    console.error('Error sending message:', error);
  }
};

const robotServerSseChat = (chatObj, text) => {
  let httpRegex = /((?:https?|ftp|file):\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(:\d+)?([-\w\u4e00-\u9fa5+&@#%?=~_\/|!:,.;]*)?/ig
  let strongRegex = /\*\*(.*?)\*\*/g;
  boolSse.value = true;
  var signalz = undefined;
  if (window.AbortController) {
    abortControllerSse = new AbortController();
    signalz = abortControllerSse.signal;
  }
  let isSswFirst = true;
  let isSearchResult = true
  let urlz = robotSetting.chatUrl;
  let reasoningHtmlAll = '', contentHtmlAll = '', recommendation = [], searchResult = [];
  allowChatRoll.value = true;
  fetch(urlz, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chatObj),
    signal: signalz
  })
    .then(function (response) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      chatMessages.value.push({
        type: 'robot-message',
        content: '',
        load: [],
        stop: 1
      });
      let chatMessagesLength = chatMessages.value.length

      function processStreamResult(result2) {
        const chunk = decoder.decode(result2.value, { stream: !result2.done });
        buffer += chunk;
        //逐条解析后端返回数据
        const lines = buffer.split('\n');
        buffer = lines.pop();
        lines.forEach(function (line) {
          if (line.trim().length > 0) {
            if (line != 'data: [DONE]') {
              sseEnd.value = false;
              //执行完成的页面逻辑
              let datass = JSON.parse(line.substring(5));
              let choices = datass.choices && datass.choices[0] || {}
              //console.log(choices);
              if (choices.message && choices.message.waitText) {
                if (chatMessages.value[chatMessagesLength - 1].load) {
                  chatMessages.value[chatMessagesLength - 1].load.forEach(it => {
                    it.flag = false;
                  })
                  chatMessages.value[chatMessagesLength - 1].load.push({ value: choices.message.waitText, flag: true })
                }
                scrollToBottom();
              }
              searchResult = datass.referenceMaterials || [];
              if (datass.recommendationItems) recommendation = datass.recommendationItems || [];
              if ((choices.message && (choices.message.reasoning_content || choices.message.content)) || (searchResult.length && isSearchResult)) {
                if (isSswFirst) {
                  isSswFirst = false;
                  chatMessages.value.forEach(item => {
                    item.load && item.load.forEach(ite => {
                      ite.flag = false;
                    })
                  })
                }
                if (searchResult.length && isSearchResult) {
                  isSearchResult = false;
                  chatMessages.value[chatMessagesLength - 1].chatSseName = '共获取' + searchResult.length + '份资料';
                  
                  chatMessages.value[chatMessagesLength - 1].chatSseNote = searchResult
                  chatMessages.value[chatMessagesLength - 1].chatSseFlag = true
                }

                if (choices.message && choices.message.reasoning_content) {
                  let reasoningHtml = choices.message.reasoning_content, reasoningArry = [];
                  reasoningHtml = reasoningHtmlAll + reasoningHtml;
                  reasoningHtmlAll = reasoningHtml;
                  reasoningArry = reasoningHtml.match(/\[\^[0-9|\,]+\^\]/ig) || [];
                  reasoningArry.forEach(function (items) {
                    var itemhtml = '';
                    var itemarry = items.substring(2, items.length - 2).split(',')
                    itemarry.forEach(function (ite) {
                      itemhtml += '<sup class="sup">' + ite + '</sup>'
                    })
                    reasoningHtml = reasoningHtml.replace(items, itemhtml)
                  })

                  chatMessages.value[chatMessagesLength - 1].reasoning_value = reasoningHtml
                  chatMessages.value[chatMessagesLength - 1].wait = true
                }

                if (choices.message && choices.message.tip) {
                  chatMessages.value[chatMessagesLength - 1].tip = choices.message.tip
                }

                if (choices.message && choices.message.content) {
                  let contentHtml = choices.message.content, contentArry = [];
                  contentHtml = contentHtmlAll + contentHtml;
                  contentHtmlAll = contentHtml;
                  if (marked) {
                    if (contentHtml.replaceAll) {
                      contentHtml = contentHtml.replaceAll(strongRegex, function (url) {
                        return ' ' + url + ' '
                      })
                      contentHtml = contentHtml.replaceAll('. ', '.').replaceAll('.**', '. **').replaceAll('-  **', '- **');
                      contentHtml = contentHtml.replaceAll(httpRegex, function (url) {
                        if (url.endsWith && url.endsWith('=')) return url;
                        return url + ' '
                      })
                    }
                    contentHtml = marked(contentHtml.replace(/<br\s*\/>\|/gi, '\n|').replace(/\|<br\s*\/>/gi, '|\n\n'));
                    if (contentHtml.replaceAll) contentHtml = contentHtml.replaceAll('</strong> ', '</strong>').replaceAll(' <strong>', '<strong>');
                  }
                  contentArry = contentHtml.match(/\[\^[0-9|\,]+\^\]/ig) || [];
                  contentArry.forEach(function (items) {
                    var itemhtml = '';
                    var itemarry = items.substring(2, items.length - 2).split(',')
                    itemarry.forEach(function (ite) {
                      itemhtml += '<sup class="sup">' + ite + '</sup>'
                    })
                    contentHtml = contentHtml.replace(items, itemhtml)
                  })
                  chatMessages.value[chatMessagesLength - 1].content = contentHtml
                }
                if (allowChatRoll.value) scrollToBottom();
              }
            }
          }
        });
        if (!result2.done && boolSse.value) {
          return reader.read().then(processStreamResult);
        } else {
          console.log('结束');
          sseEnd.value = true;
          addHistoricRecords(text);

          chatMessages.value[chatMessagesLength - 1].waitFlag = true
          chatMessages.value[chatMessagesLength - 1].stop = 3

          if (!boolSse.value) return;

          chatMessages.value[chatMessagesLength - 1].copy = true
          chatMessages.value[chatMessagesLength - 1].recommendation = recommendation

          if (allowChatRoll.value) scrollToBottom();
        }
      }
      return reader.read().then(processStreamResult);
    })
    .catch(function (error) {
      console.log('error', error)
      addHistoricRecords(text)
      sseEnd.value = true
      if (boolSse.value) showErrorMessage('网络超时请稍后再尝试')
    });
}

// 显示错误消息
const showErrorMessage = (message) => {
  errorMessage.value = message;
  setTimeout(() => {
    errorMessage.value = '';
  }, 3000);
};

// 滚动到聊天底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

// 地域选择相关函数
const setPositioningz = () => {
  let areaName = '', areaLongName = '';
  if (selectedAreaId.value == areaData.areaId) {
    areaName = areaData.name;
  } else {
    const seekAreaz = (data) => {
      data && data.forEach((item1) => {
        if (item1.areaId == selectedAreaId.value) {
          areaName = item1.name;
          areaLongName = item1.name;
        } else {
          seekAreaz(item1.childAreaInfos);
        }
      });
    };
    seekAreaz(areaData.childAreaInfos);
  }
  selectedAreaLongName.value = areaLongName
  selectedAreaName.value = areaName;
  initPosition();
};

const initPosition = () => {
  currentAreas.value = areaData.childAreaInfos || []
  selectedAreas.value = [areaData]
  currentAreas.value.forEach(it => {
    it.active = false
  })
  if (selectedAreaId.value != areaData.areaId) {
    function seekAreaa(data) {
      data && data.forEach((item1) => {
        if (selectedAreaLongName.value === item1.name) {
          selectedAreas.value.push(item1)
          if (item1.childAreaInfos && item1.childAreaInfos.length) {
            currentAreas.value = [...item1.childAreaInfos]
            currentAreas.value.forEach(it => {
              it.active = false
            })
          } else {
            currentAreas.value.forEach(it => {
              it.active = it.areaId == selectedAreaId.value ? true : false;
            })
          }
        } else if (item1.childAreaInfos && JSON.stringify(item1.childAreaInfos).includes(selectedAreaLongName.value)) {
          selectedAreas.value.push(item1)
          currentAreas.value = [...item1.childAreaInfos]
          seekAreaa(item1.childAreaInfos)
        }
      })
    }

    seekAreaa(areaData.childAreaInfos)
  }

};

const areaBack = (item, index) => {
  selectedAreas.value.splice((index + 1), 10)
  currentAreas.value = [...item.childAreaInfos]
  currentAreas.value.forEach(it => {
    it.active = false
  })
};

const selectChange = (item) => {
  let bools = false;
  currentAreas.value.forEach(it => {
    if (it.active) bools = true;
    it.active = false
  })
  if (bools) selectedAreas.value.splice((selectedAreas.value.length - 1), 1);

  if (item.childAreaInfos && item.childAreaInfos.length) {
    selectedAreas.value.push(item)
    currentAreas.value = [...item.childAreaInfos]
    currentAreas.value.forEach(it => {
      it.active = false
    })
  } else {
    item.active = true
    selectedAreas.value.push(item)
  }
};

const confirmArea = () => {
  const lastArea = selectedAreas.value[selectedAreas.value.length - 1];
  selectedAreaName.value = lastArea.name;

  selectedAreaId.value = lastArea.areaId
  selectedAreaLongName.value = lastArea.name;

  hidePositioningModal();
};


const showPositioningModal = () => {
  initPosition();
  showPositioning.value = true;
};

const hidePositioningModal = () => {
  showPositioning.value = false;
};

// 历史记录相关函数
const toggleHistory = () => {
  showHistory.value = !showHistory.value;
};

const selectHistoryRecord = (record) => {
  question.value = record;
  showHistory.value = false;
  sendMessage()
};

const deleteHistoryRecord = (index) => {
  historicRecords.value.splice(index, 1);
  localStorage.historicRecordsVal = encodeURI(JSON.stringify(historicRecords.value));
};

// 模态框相关函数
const showModalWithContent = (title, content) => {
  modalTitle.value = title;
  modalContent.value = content;
  showModal.value = true;
};

const hideModal = () => {
  showModal.value = false;
};

// 切换深度解读
const toggleRag = () => {
  useRag.value = !useRag.value;
};

// 切换联网搜索
const toggleWebSearch = () => {
  useWebSearch.value = !useWebSearch.value;
};

// 生命周期钩子
onMounted(() => {
  initApp();
});
</script>
