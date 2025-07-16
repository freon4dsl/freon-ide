import { DefaultWorkspaceManager, FileSystemNode, LangiumSharedCoreServices, WorkspaceFolder } from "langium"

export class FreonWorkspaceManager extends DefaultWorkspaceManager {

    constructor(services: LangiumSharedCoreServices) {
        super(services)
        console.log("FreonWorkspaceManager")
    }


    protected override includeEntry(_workspaceFolder: WorkspaceFolder, entry: FileSystemNode, fileExtensions: string[]): boolean {
        return false
        // if (entry.uri.toString().includes("demo")) {
        //     console.log(`ws.uri    '${_workspaceFolder.uri}'`)
        //     console.log(`ws.name   '${_workspaceFolder.name}'`)
        //     console.log(`entry.uri '${entry.uri.toString()}'`)
        //     console.log(`entry.fsp '${entry.uri.fsPath}'`)
        //     console.log(`entry.path '${entry.uri.path}'`)
        //     console.log(`entry.json '${JSON.stringify(entry.uri.toJSON())}'`)
        //     return false
        // } else {
        //     return super.includeEntry(_workspaceFolder, entry, fileExtensions)
        // }
    }
}