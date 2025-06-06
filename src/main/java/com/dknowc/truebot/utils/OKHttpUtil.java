package com.dknowc.truebot.utils;

import okhttp3.*;
import okhttp3.internal.sse.RealEventSource;
import okhttp3.sse.EventSource;
import okhttp3.sse.EventSourceListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * @Classname OKHttpUtil
 * @Description: 调用工具类
 */
public class OKHttpUtil {

    private static final Logger log = LoggerFactory.getLogger(OKHttpUtil.class);

    private static volatile OkHttpClient client;

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    public static OkHttpClient getClient() {
        if (client == null) {
            synchronized (OKHttpUtil.class) {
                if (client == null) {
                    client = new OkHttpClient.Builder()
                            .connectTimeout(10, TimeUnit.SECONDS)
                            .readTimeout(0, TimeUnit.SECONDS)
                            .writeTimeout(10, TimeUnit.SECONDS)
                            .connectionPool(new ConnectionPool(50, 5, TimeUnit.MINUTES))
                            .retryOnConnectionFailure(true)
                            .build();
                }
            }
        }
        return client;
    }

    public static void stream(String url, String jsonBody, Map<String, String> headers, SseEmitter emitter) {
        RequestBody body = RequestBody.create(jsonBody, JSON);
        Request.Builder builder = new Request.Builder()
                .url(url)
                .post(body)
                .addHeader("Accept", "text/event-stream");
        if (headers != null) {
            headers.forEach(builder::addHeader);
        }
        Request request = builder.build();
        OkHttpClient client = getClient();
        RealEventSource eventSource = new RealEventSource(request, new EventSourceListener() {
            @Override
            public void onOpen(EventSource eventSource, Response response) {
                log.info("SSE connection opened.");
            }
            @Override
            public void onClosed(EventSource eventSource) {
                log.info("SSE connection closed.");
                emitter.complete();
            }
            @Override
            public void onFailure(EventSource eventSource, Throwable t, Response response) {
                emitter.completeWithError(t);
            }
            @Override
            public void onEvent(EventSource eventSource, String eventName, String id, String data) {
                if (data != null && !data.isEmpty()) {
                    try {
                        log.info("Received content:{}", data);
                        emitter.send(SseEmitter.event().data(data));
                    } catch (IOException e) {
                        emitter.completeWithError(e);
                    }
                }
            }
        });
        eventSource.connect(client);
    }

}
