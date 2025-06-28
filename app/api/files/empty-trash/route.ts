import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm"
import ImageKit from "imagekit";
import { FileObject } from "imagekit/dist/libs/interfaces";

const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function DELETE() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"},
            {status: 401})
        }

        const trashedFiles = await db.select().from(files).where(
            and(
                eq(files.userId, userId),
                eq(files.isTrash, true)
            )
        )

        if (trashedFiles.length === 0) {
            return NextResponse.json(
                { message: "No files in trash" },
                { status: 200 }
            );
        }

        const deletePromises = trashedFiles.filter((files) => !files.isFolder)
            .map(async (file) => {
                try {
                    let imagekitFileId = null

                    if (file.fileUrl) {
                        const urlWithoutQuery = file.fileUrl.split("?")[0];
                        imagekitFileId = urlWithoutQuery.split("/").pop();
                    }

                    if ( !imagekitFileId && file.path ) {
                        imagekitFileId = file.path.split("/").pop();
                    }

                    if ( imagekitFileId ) {
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
                            console.error(`Error searching for file in ImageKit:`,searchError);
                            await imagekit.deleteFile(imagekitFileId);
                        }
                    }
                } catch (error) {
                    console.error(`Error deleting file ${file.id} from ImageKit:`, error);
                }
            })
        
        await Promise.allSettled(deletePromises)

        await db.delete(files).where(
            and(
                eq(files.userId, userId),
                eq(files.isTrash, true)
            )
        )
        return NextResponse.json({message: "All files deleted"}, {status: 200})

    } catch (error) {
        return NextResponse.json({ message: "Failed to delete the files!", error: error },{status: 500})
    }
}