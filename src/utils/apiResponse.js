export const successRes = (res, { 
  data = null, 
  message = 'Operación exitosa', 
  statusCode = 200 
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorRes = (res, { 
  message = 'Error en la operación', 
  statusCode = 500,
  errors = null 
}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};