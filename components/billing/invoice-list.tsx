"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, FileText, Loader2 } from "lucide-react";

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount_paid: number;
  amount_due: number;
  currency: string;
  created: number;
  due_date: number | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: number | null;
  period_end: number | null;
  lines: Array<{
    id: string;
    description: string | null;
    amount: number;
    plan: {
      nickname: string | null;
      interval: string;
    } | null;
  }>;
}

interface InvoiceListProps {
  limit?: number;
}

export function InvoiceList({ limit = 10 }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchInvoices();
  }, [limit]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices?limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch invoices");
      }

      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      setDownloadingInvoice(invoiceId);
      const response = await fetch(
        `/api/billing/download-invoice?invoice_id=${invoiceId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to download invoice");
      }

      // Open the PDF in a new tab
      if (data.download_url) {
        window.open(data.download_url, "_blank");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert(err instanceof Error ? err.message : "Failed to download invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { variant: "default" as const, label: "Paid" },
      open: { variant: "secondary" as const, label: "Pending" },
      void: { variant: "outline" as const, label: "Void" },
      draft: { variant: "outline" as const, label: "Draft" },
      uncollectible: { variant: "destructive" as const, label: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: "secondary" as const,
      label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchInvoices} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600">No invoices found</p>
        <p className="text-sm text-gray-500 mt-2">
          Invoices will appear here once you have an active subscription
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">
                {invoice.number || invoice.id.slice(-8)}
              </TableCell>
              <TableCell>{formatDate(invoice.created)}</TableCell>
              <TableCell>
                {invoice.lines[0]?.plan?.nickname ||
                  invoice.lines[0]?.description ||
                  "Subscription"}
                {invoice.period_start && invoice.period_end && (
                  <div className="text-xs text-gray-500">
                    {formatDate(invoice.period_start)} -{" "}
                    {formatDate(invoice.period_end)}
                  </div>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
              <TableCell className="font-medium">
                {formatAmount(
                  invoice.amount_paid || invoice.amount_due,
                  invoice.currency
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {invoice.hosted_invoice_url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {invoice.invoice_pdf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadInvoice(invoice.id)}
                      disabled={downloadingInvoice === invoice.id}
                    >
                      {downloadingInvoice === invoice.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {invoices.length >= limit && (
        <div className="text-center">
          <Button variant="outline" onClick={() => fetchInvoices()}>
            Load More Invoices
          </Button>
        </div>
      )}
    </div>
  );
}
