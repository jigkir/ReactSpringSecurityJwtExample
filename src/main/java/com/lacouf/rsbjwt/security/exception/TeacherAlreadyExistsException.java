package com.lacouf.rsbjwt.security.exception;

public class TeacherAlreadyExistsException extends Exception {
  public TeacherAlreadyExistsException() {
    super("Teacher already exists");
  }
}
