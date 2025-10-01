import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { parse } from 'date-fns/parse';
import { ArrowDownRight, ArrowUpRight} from 'lucide-react';
import React from 'react'

const AccountCard = ({ account }) => {                       
                                                                  
    const { name,type, balance, id, isDefault } = account;
    return (
        <Card>
            <Link href={`/account/${id}`}>

            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <Switch />
            </CardHeader>
            <CardContent>
                <div className='text-2xl font-bold'>
                    ₹{parseFloat(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className='text-xs text-muted-foreground'>
                    {type.charAt(0) + type.slice(1).toLowerCase()} Account
                </p>
            </CardContent>
            <CardFooter>
                <div className='flex items-center'>
                    <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                    Income
                </div>
                <div className='flex items-center'>
                    <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                    Expense
                </div>
            </CardFooter>
            </Link>
        </Card>
    )
}

export default AccountCard