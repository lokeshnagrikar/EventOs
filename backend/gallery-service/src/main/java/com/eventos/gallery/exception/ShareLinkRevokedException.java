package com.eventos.gallery.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.GONE)
public class ShareLinkRevokedException extends RuntimeException {
    public ShareLinkRevokedException(String message) {
        super(message);
    }
}
