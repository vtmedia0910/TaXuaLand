import {handle} from '@land/api/http';
import {publicLayers} from '@land/api/layers';
export function GET(request:Request){return handle(request,async()=>Response.json(await publicLayers()));}
