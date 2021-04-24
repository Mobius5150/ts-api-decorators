import { Api, ApiGetMethod, ApiPostMethod, ApiPutMethod, ApiDeleteMethod } from "../../../src";

@Api
class MyApi {

	@ApiGetMethod('/get')
	get() {
		return 'hello-get';
    }
    
    @ApiPutMethod('/put')
	put(
	) {
        return 'hello-put';
    }
    
    @ApiPostMethod('/post')
	post(
	) {
        return 'hello-post';
    }
    
    @ApiDeleteMethod('/delete')
	delete(
	) {
        return 'hello-delete';
    }

    @ApiGetMethod('/hello')
	helloGet() {
		return 'hello-get';
    }
    
    @ApiPutMethod('/hello')
	helloPut(
	) {
        return 'hello-put';
    }
    
    @ApiPostMethod('/hello')
	helloPost(
	) {
        return 'hello-post';
    }
    
    @ApiDeleteMethod('/hello')
	helloDelete(
	) {
        return 'hello-delete';
    }
    
}