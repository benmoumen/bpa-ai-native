import { HttpExceptionFilter } from './http-exception.filter';
import {
  HttpStatus,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ArgumentsHost,
} from '@nestjs/common';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockGetRequest: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockSwitchToHttp: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockGetRequest = jest.fn().mockReturnValue({
      url: '/test',
      method: 'GET',
      headers: {},
    });
    mockGetResponse = jest.fn().mockReturnValue({
      status: mockStatus,
    });
    mockSwitchToHttp = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
      getResponse: mockGetResponse,
    });
    mockHost = {
      switchToHttp: mockSwitchToHttp,
    } as unknown as ArgumentsHost;
  });

  const getErrorResponse = (): ErrorResponse => {
    const calls = mockJson.mock.calls as ErrorResponse[][];
    return calls[0][0];
  };

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException with correct status and format', () => {
    const exception = new NotFoundException('Resource not found');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);

    const response = getErrorResponse();
    // NestJS NotFoundException returns "Not Found" as the error name
    expect(response.error.code).toBe('Not Found');
    expect(response.error.message).toBe('Resource not found');
    expect(response.error.requestId).toBeDefined();
  });

  it('should handle BadRequestException with validation errors', () => {
    const validationErrors = ['field1 is required', 'field2 must be a string'];
    const exception = new BadRequestException({
      message: validationErrors,
      error: 'Bad Request',
    });

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);

    const response = getErrorResponse();
    expect(response.error.code).toBe('Bad Request');
    expect(response.error.message).toBe('Validation failed');
    expect(response.error.details).toEqual({ validationErrors });
  });

  it('should handle unknown exceptions as internal server error', () => {
    const exception = new Error('Unexpected error');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

    const response = getErrorResponse();
    expect(response.error.code).toBe('INTERNAL_ERROR');
    expect(response.error.message).toBe('Internal server error');
    expect(response.error.requestId).toBeDefined();
  });

  it('should use existing X-Request-ID header if provided', () => {
    const requestId = 'existing-request-id-123';
    mockGetRequest.mockReturnValue({
      url: '/test',
      method: 'GET',
      headers: { 'x-request-id': requestId },
    });

    const exception = new NotFoundException('Not found');
    filter.catch(exception, mockHost);

    const response = getErrorResponse();
    expect(response.error.requestId).toBe(requestId);
  });

  it('should handle InternalServerErrorException', () => {
    const exception = new InternalServerErrorException('Database error');
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

    const response = getErrorResponse();
    // NestJS InternalServerErrorException returns "Internal Server Error" as error name
    expect(response.error.code).toBe('Internal Server Error');
  });
});
