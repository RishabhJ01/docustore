import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"},
            {status: 401})
        }
        const body = await request.json()
        const { name, userId: bodyUserId, parentId = null } = body

        if (bodyUserId !== userId) {
            return NextResponse.json({error: "Unauthorized"},
            {status: 401})
        }

        if (!name || typeof name !== "string" || name.trim() === "") {
            return NextResponse.json({error: "Unauthorized"},
            {status: 401})
        }

        if (parentId) {
            const [ parentFolder ] = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.id, parentId),
                        eq(files.userId, userId),
                        eq(files.isFolder, true)
                    )
                )
            if (!parentFolder) {
                return NextResponse.json({error: "Parent folder not found"},
                {status: 401})
            }
        }

        // create a folder in database
        const folderId = uuidv4()
        const folderData = {
            id: folderId,
            name: name.trim(),
            path: `/folders/${userId}/${folderId}`,
            size: 0,
            type: "folder",
            fileUrl: "",
            thumbnailUrl: "",
            userId,
            parentId,
            isFolder: true,
            isStarred: false,
            isTrash: false,
        }

        const [newFolder] = await db.insert(files).values(folderData).returning()
        return NextResponse.json({
            success: true,
            message: "Folder created successfully",
            folder: newFolder
        })
    } catch (error) {
        return NextResponse.json({ message: "Failed to generate authentication parameters for imagekit", error: error }, {status: 500})
    }
}