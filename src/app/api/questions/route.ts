import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";

const inMemoryQuestions: any[] = [];

const SEED_QUESTIONS = [
  { text: "The fat cat sat on the red mat.", level: "Starters" },
  { text: "I like to eat apples and bananas.", level: "Starters" },
  { text: "The little bird can fly very high.", level: "Starters" },
  { text: "My dog has a big brown ball.", level: "Starters" },
  { text: "Yesterday, the clever monkey washed a big round melon.", level: "Movers" },
  { text: "The children played in the park after school.", level: "Movers" },
  { text: "She bought a beautiful dress for the party.", level: "Movers" },
  { text: "We went to the zoo and saw many animals.", level: "Movers" },
  { text: "The brave flying lion flew high in the beautiful sky.", level: "Flyers" },
  { text: "Scientists are exploring the mysteries of outer space.", level: "Flyers" },
  { text: "The ancient castle stood on top of the hill.", level: "Flyers" },
  { text: "She whispered a secret to her best friend.", level: "Flyers" },
];

async function seedQuestions() {
  try {
    const count = await Question.countDocuments();
    if (count === 0) {
      await Question.insertMany(SEED_QUESTIONS);
      console.log(`🌱 Đã seed ${SEED_QUESTIONS.length} câu hỏi mẫu vào MongoDB`);
    }
  } catch (err) {
    console.warn("⚠️ Lỗi seed questions:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");

    if (!level || !["Starters", "Movers", "Flyers"].includes(level)) {
      return NextResponse.json(
        { error: "Vui lòng truyền level hợp lệ: Starters, Movers, hoặc Flyers" },
        { status: 400 }
      );
    }

    const { isFallback } = await connectToDatabase();

    let question = null;

    if (!isFallback) {
      await seedQuestions();
      try {
        const result = await Question.aggregate([
          { $match: { level } },
          { $sample: { size: 1 } },
        ]);
        if (result.length > 0) {
          question = result[0];
        }
      } catch (dbError) {
        console.warn("⚠️ MongoDB query lỗi, dùng fallback:", dbError);
      }
    }

    if (!question) {
      const filtered = inMemoryQuestions.length > 0
        ? inMemoryQuestions.filter((q) => q.level === level)
        : SEED_QUESTIONS.filter((q) => q.level === level);

      if (filtered.length === 0) {
        return NextResponse.json(
          { error: "Không tìm thấy câu hỏi nào cho level này" },
          { status: 404 }
        );
      }

      question = filtered[Math.floor(Math.random() * filtered.length)];
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API GET questions:", error);
    return NextResponse.json(
      { error: "Không thể lấy câu hỏi: " + error.message },
      { status: 500 }
    );
  }
}
