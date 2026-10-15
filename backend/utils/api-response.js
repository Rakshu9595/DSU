export class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      status: 'success',
      message,
      data
    });
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'An error occurred', statusCode = 500, details = null) {
    return res.status(statusCode).json({
      status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
      message,
      ...(details ? { details } : {})
    });
  }
}
