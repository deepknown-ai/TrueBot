package com.dknowc.truebot.controller;

import com.dknowc.truebot.Chat;
import com.dknowc.truebot.service.MaasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * @Classname MaasController
 * @Description: maas请求处理Controller
 */
@RestController
@RequestMapping("maas")
public class MaasController {

    @Autowired
    private MaasService maasService;

    @PostMapping("chat/completion")
    public SseEmitter chatCompletion(@RequestBody Chat chat) {
        return maasService.chatCompletion(chat);
    }

}
