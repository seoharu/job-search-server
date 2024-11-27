exports.success = (data, pagination = null) => {
  const response = {
    status: 'success',
    data
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
};

exports.error = (message, code) => {
  return {
    status: 'error',
    message,
    code
  };
};