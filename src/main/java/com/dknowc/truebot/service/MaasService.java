package com.dknowc.truebot.service;

import com.alibaba.fastjson.JSON;
import com.dknowc.truebot.utils.HeaderUtil;
import com.dknowc.truebot.Chat;
import com.dknowc.truebot.utils.OKHttpUtil;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @Classname MaasService
 * @Description: maas请求处理类
 */
@Service
public class MaasService {

    /**
     * maas平台申请的appKey，必填项
     */
    @Value("${maas.appKey}")
    private String appKey;

    /**
     * maas平台申请的appSecret，必填项
     */
    @Value("${maas.appSecret}")
    private String appSecret;

    /**
     * maas平台绑定的标准知识接口应用地址，必填项
     */
    @Value("${maas.chat.completion.url}")
    private String chatCompletionUrl;

    /**
     * 标准知识接口调用处理类
     * @param chat 请求参数
     * @return 返回sseEmitter
     */
    public SseEmitter chatCompletion(Chat chat) {
        SseEmitter emitter = new SseEmitter(0L);
        if (StringUtils.isBlank(appKey)
                || StringUtils.isBlank(appSecret)
                || StringUtils.isBlank(chatCompletionUrl)) {
            try {
                emitter.send(SseEmitter.event().data(JSON.toJSONString(errorMap())));
            } catch (IOException e) {
                throw new RuntimeException(e);
            } finally {
                emitter.complete();
            }
            return emitter;
        }
        Map<String, String> authHeaders = HeaderUtil.createHeaders(appKey, appSecret);
        OKHttpUtil.stream(chatCompletionUrl, JSON.toJSONString(chat), authHeaders, emitter);
        return emitter;
    }

    private Map<String, Object> errorMap() {
        Map<String, Object> root = new LinkedHashMap<>();
        Map<String, Object> message = new LinkedHashMap<>();
        message.put("content", "后端参数配置无效！");
        Map<String, Object> choice = new LinkedHashMap<>();
        choice.put("index", 0);
        choice.put("finish_reason", "stop");
        choice.put("message", message);
        List<Map<String, Object>> choices = new ArrayList<>();
        choices.add(choice);
        root.put("choices", choices);
        return root;
    }
}
