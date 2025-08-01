import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm"

export async function PATCH(request: NextRequest, props: { params: Promise<{fileId: string}>}) {
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
                eq(files.id, fileId),
                eq(files.userId, userId)
        ))

        if (!file) {
            return NextResponse.json({ error: "File not found!" }, { status: 404 })
        }

        const updatedFiles = await db.update(files).set({
            isStarred: !file.isStarred,
            updatedAt: new Date()
        }).where(
            and(
                eq(files.id, fileId),
                eq(files.userId, userId)
        )).returning()
        const updatedFile = updatedFiles[0]
        return NextResponse.json(updatedFile)

    } catch (error) {
        return NextResponse.json({ message: "Failed to update the file", error: error },{status: 500})
    }
}