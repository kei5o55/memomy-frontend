"use client";

import { useEffect,useState } from "react";
import { localUser } from "../../logic/dummyDate"
import type { Summary, User, Project } from "../../logic/types"
import Link from "next/link"
import { loadProjects, projectSummary } from "@/logic/api-request";

const user:User[]=localUser;

const loadData =await projectSummary();

export default function Page(){
    const [projects,setProjects] = useState<Project[]>([]);
    const [summary,setSummary] = useState<Summary[]| null>(null);
    
    useEffect(() => {
        const fetchdata =async()=>{
            try{
                const fetchProjects = await loadProjects();
                setProjects(fetchProjects);
                const targetIds = projects.map(projects => projects.id)
                if(targetIds.length > 0){
                    console.log("data: ")
                }
                const fetchsummary = await projectSummary();
                setSummary(fetchsummary);
            }catch(error){
                console.log("取得失敗してるで",error)
            }
        }

        fetchdata();
    }, []);

    const log =()=>{
        console.log("projects:",projects);
        console.log("ids:",projects.map((p)=>p.id));
        console.log("summary:",summary)
    }  

   
    return(
        <div>
            test
            <Link href={`/users/${user[0].id}`}>1</Link>
            <Link href={`/users/${user[1].id}`}>2</Link>
            <button className="border cursor-pointer" onClick={log}>うおお</button>

            {/* ⭕️ State の中身を表示（オブジェクトの場合はプロパティを指定） */}
            {summary && summary.length>0 ? (
             <div>
                {summary.map((item,index) => (
                    <div key={index}>
                        <p>{item.totalDurationMs}</p>
                    </div>
                ))}  
            </div>
            ): (
                <p>読み込み中</p>
            )}
        </div>
    );
}