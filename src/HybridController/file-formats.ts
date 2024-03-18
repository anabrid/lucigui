import * as hctypes from "./programming"

type FileMetaInformation = {
    desc?: string,
    title?: string
}

// this is *only* a physical routes file.
type RoutesFile = FileMetaInformation & {
    routes: hctypes.PhysicalRoute[],
    MIntConfig?: hctypes.MIntConfig
}

function routes_from_file(file_struct: RoutesFile ) {

    // TODO:
    //   1) Generate JSON Schemas for various types such as RoutesFile
    //   2) Test against the schema.
}