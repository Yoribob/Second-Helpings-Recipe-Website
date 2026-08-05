interface HeaderProps {
    appName: string,
    links: {label: string, href: string}[],
}

export function Header({appName, links}: HeaderProps) {
    return (
        <header>
            <strong>{appName}</strong>
            <ul>
                {links.map((link) => (
                    <li key={link.href}>
                        <a href={link.href}>{link.label}</a>
                    </li>
                ))}
            </ul>
        </header>
    )
}