import React, { memo } from 'react'
import Link from 'next/link'
import { Button } from '@material-ui/core'
import { useRouter } from 'next/router'
import { useUser } from './UserProvider'

function Menu() {
    const router = useRouter()
    const whoAmI = useUser()

    const { query } = router
    const printMode = query.print && query.print !== 'false'

    if (printMode) {
        return null
    }

    const links = () => ([{
            name: 'search',
            url: '/',
            next: true,
        },{
            name: 'insights',
            url: '/insights',
            next: true,
        },{
            name: 'about',
            url: 'https://github.com/liquidinvestigations/hoover-search',
        },
        //{
        //    name: 'terms',
        //    url: '/terms',
        //    next: true,
        //},
        {
            name: 'documentation',
            url: 'https://github.com/liquidinvestigations/docs/wiki/User---Hoover',
        },{
            name: 'login',
            url: whoAmI.urls.login,
            type: 'not-logged-in',
        },{
            name: 'admin',
            url: whoAmI.urls.admin,
            type: 'admin',
        },{
            name: `logout (${whoAmI.username})`,
            url: whoAmI.urls.logout,
            type: 'logged-in',
        }]
            .map(link => ({ ...link, active: router.asPath === link.url }))
    )

    const shouldShow = link => {
        if (link.type === 'admin') {
            return whoAmI.admin;
        }
        if (link.type === 'logged-in') {
            return whoAmI.username;
        }
        if (link.type === 'not-logged-in') {
            return !whoAmI.username;
        }
        return true;
    }

    return (
        <>
            {links()
                .filter(shouldShow)
                .map(link => {
                    const b = (
                        <Button
                            key={link.name}
                            variant="text"
                            component="a"
                            href={link.url}
                            color="inherit">
                            {link.name}
                        </Button>
                    );

                    return (!link.next ? b :
                        <Link key={link.name} href={link.url} shallow>
                            {b}
                        </Link>
                    )
                })
            }
        </>
    )
}

export default memo(Menu)
