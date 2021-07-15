import React from 'react'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core'
import { formatTitleCase } from '../../utils'

export default function TaskErrorsTable({ errors }) {
    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Func</TableCell>
                        <TableCell align="right">Error type</TableCell>
                        <TableCell align="right">Count</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {errors.map(({ func, error_type, count }) => (
                        <TableRow key={func}>
                            <TableCell component="th" scope="row">
                                {formatTitleCase(func)}
                            </TableCell>
                            <TableCell align="right">{error_type}</TableCell>
                            <TableCell align="right">{count}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
