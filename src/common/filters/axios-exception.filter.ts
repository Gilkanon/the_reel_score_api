import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AxiosError } from 'axios';

@Catch(AxiosError)
export class AxiosExceptionFilter implements ExceptionFilter {
  catch(exception: AxiosError, host: ArgumentsHost) {
    const status = exception.response?.status;

    if (status === 404) {
      throw new NotFoundException(
        'The requested resource was not found in the external API.',
      );
    }

    throw new InternalServerErrorException(
      'An error occurred while accessing an external service.',
    );
  }
}
