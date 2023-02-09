export class ErrorHandler extends Error {
  statusCode: number;
  message: string;

  public constructor(statusCode: number, message: string) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}
