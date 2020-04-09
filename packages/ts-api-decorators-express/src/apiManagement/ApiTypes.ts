import * as express from 'express';

export interface ExpressMiddlewareArgument {
	middleware: express.Handler,
}