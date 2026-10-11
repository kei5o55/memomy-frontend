"use client";

import { useEffect,useState } from "react";
import { localUser } from "../../logic/dummyDate"
import type { Summary, User } from "../../logic/types"
import Link from "next/link"
import { projectSummary } from "@/logic/api-request";

const user:User[]=localUser;
const targetId = "f8a809e0-709f-4cbb-a047-778fb3cd5b62"

export default function page(){
    const [summary,setSummary] = useState<Summary| null>();
    useEffect(() => {
    // ⭕️ async 関数を内部で定義して呼び出す
    const fetchSummary = async () => {
      try {
        const data = await projectSummary(targetId);
        setSummary(data);
      } catch (error) {
        console.error("サマリーの取得に失敗しました:", error);
      }
    };

    fetchSummary();
  }, []);

    return(
        <div>
            test
            <Link href={`/users/${user[0].id}`}>1</Link>
            <Link href={`/users/${user[1].id}`}>2</Link>
            {/* ⭕️ State の中身を表示（オブジェクトの場合はプロパティを指定） */}
                {summary ? (
                    <div>
                    <p>総作業時間 (ms): {summary.totalDurationMs}</p>
                    <p>総作業時間 (分): {summary.totalMinutes}</p>
                    <p>セッション数: {summary.sessionCount}</p>
                    </div>
                ) : (
                    <p>読み込み中...</p>
                )}
        </div>
    )
}