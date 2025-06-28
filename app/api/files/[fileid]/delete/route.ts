import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm"
import ImageKit from "imagekit";
import { FileObject } from "imagekit/dist/libs/interfaces";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function DELETE(request: NextRequest, props: { params: Promise<{fileId: string}>}) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"},
            {status: 401})
        }

        const { fileId } = await props.params
        if (!fileId) {
            return NextResponse.json({ error: "File Id required" }, { status: 404 });
        }

        const [file] = await db.select().from(files).where(
            and(
                eq(files.userId, userId),
                eq(files.id, fileId)
        ))

        if (!file) {
            return NextResponse.json({ error: "File not found!" }, { status: 404 })
        }

        if (!file.isFolder) {
            try {
                let imagekitFileId = null

                if (file.fileUrl) {
                    const urlWithoutQuery = file.fileUrl.split('?')[0]
                    imagekitFileId = urlWithoutQuery.split('/').pop()
                    console.log("1: ",file.fileUrl)
                }

                if (!imagekitFileId && file.path) {
                    imagekitFileId = file.path.split("/").pop()
                    console.log("2: ",file.path)
                }

                if (imagekitFileId) {
                    try {
                        const searchResults = await imagekit.listFiles({
                            name: imagekitFileId,
                            limit: 1
                        })

                        if ( searchResults && searchResults.length > 0) {
                            await imagekit.deleteFile((searchResults[0] as FileObject).fileId)
                        } else {
                            await imagekit.deleteFile(imagekitFileId)
                        }
                    } catch (searchError) {
                        console.error(`Error searching for file in ImageKit:`, searchError)
                        await imagekit.deleteFile(imagekitFileId)
                    }
                }

            } catch (error) {
                console.error(`Error deleting file ${fileId} from ImageKit:`, error);
            }
        }
        const deletedFiles = await db.delete(files).where(
            and(
                eq(files.userId, userId),
                eq(files.isTrash, true),
                eq(files.id, fileId)
            )
        ).returning()

        const deletedFile = deletedFiles[0]
        
        return NextResponse.json(deletedFile)

    } catch (error) {
        return NextResponse.json({ message: "Failed to update the file", error: error },{status: 500})
    }
}