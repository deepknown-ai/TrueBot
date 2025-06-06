package com.dknowc.truebot.utils;

import cn.hutool.crypto.SmUtil;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * @Classname HeaderUtil
 * @Description: 请求头构建工具类
 */
public class HeaderUtil {

    public static Map<String, String> createHeaders(String appKey, String appSecret) {
        Map<String, String> headers = new HashMap<>();
        String nonce = UUID.randomUUID().toString().replace("-", "");
        String time = String.valueOf(System.currentTimeMillis());
        String str = appKey + "-" + appSecret + "-" + nonce + "-" + time;
        String signStr = SmUtil.sm3(str);
        headers.put("auth-app-key", appKey);
        headers.put("auth-nonce", nonce);
        headers.put("auth-timestamp", time);
        headers.put("auth-sign", signStr);
        headers.put("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0");
        return headers;
    }

}
