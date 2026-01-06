import Link from "next/link";


export default function Button({text, style, path}: {text: string, style: string, path: string}) {
    return (

        <Link href={path}>
        <div>
            <button className = {style} >
                <h6>{text}</h6>
            </button>
        </div>
        </Link>
    )
}

