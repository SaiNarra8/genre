import { auth } from "@clerk/nextjs";
import { Configuration, OpenAIApi } from "openai";
import { NextResponse } from "next/server";

import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";

const configuration = new Configuration({
    apiKey: process.env.OPEN_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(
    req: Request
) {
    try{
        
        const { userId } = auth();
        const body = await req.json();
        const { messages } = body;

        if (!userId) {
            return new NextResponse("Unauthorized!", { status: 401 });
        }

        if (!configuration.apiKey) {
            return new NextResponse("OpenAI API Key not configured!", { status: 500 });
        }

        if (!messages) {
            return new NextResponse("Messages are required!", { status: 400 });
        }

        const freeTrial = await checkApiLimit();

        if(!freeTrial){
            return new NextResponse("Free trial has expired", {status: 403});
        }

        await increaseApiLimit();

        const response = await openai.createChatCompletion({
            model:"gpt-3.5-turbo",
            messages
        });

        
        
        return NextResponse.json(response.data.choices[0].message);
    }
    catch (error) {
        console.log("[CONVERSATION_ERROR", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 