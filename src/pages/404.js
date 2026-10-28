import Link from 'next/link'
import { Result } from 'antd'
import { useEffect } from 'react'
import { logger } from '@/lib/helpers/logger'

export default function NotFound() {
    useEffect(() => {
        logger.all.error({ message: 'NotFound' })
    }, [])

    return (
        <Result
            status='404'
            title='404'
            subTitle='Sorry, the page you visited does not exist.'
            extra={
                <Link href='/' className='c-btn c-btn--primary px-4'>
                    Back Home
                </Link>
            }
        />
    )
}
